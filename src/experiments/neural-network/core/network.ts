import { mulberry32 } from "@/engine/public";
import type { NnConfig } from "../config";
import {
  MAX_INPUTS,
  MAX_LAYERS,
  MAX_LAYER_SIZE,
  PARAM_LIMIT,
  SCALE,
  paramCounts,
  type ActivationId,
} from "../limits";

/**
 * Pure feed-forward network maths. No DOM, no React, no clocks, no Math.random.
 *
 * Determinism note: linear/relu are exact; sigmoid and tanh use Math.exp, which can differ in
 * the last bit between JavaScript engines. The UI shows 3 decimals, so shared links look
 * identical everywhere; tests compare with explicit tolerances.
 */

export const ACTIVATION_INFO: Record<
  ActivationId,
  { name: string; formula: string; note: string }
> = {
  linear: {
    name: "Linear",
    formula: "f(z) = z",
    note: "Passes the value through unchanged. Useful for outputs that are plain numbers.",
  },
  relu: {
    name: "ReLU",
    formula: "f(z) = max(0, z)",
    note: "Zero for negative inputs, the input itself otherwise. The workhorse of modern networks.",
  },
  sigmoid: {
    name: "Sigmoid",
    formula: "f(z) = 1 / (1 + e^-z)",
    note: "Squashes any number into 0 to 1, so it reads as a probability.",
  },
  tanh: {
    name: "Tanh",
    formula: "f(z) = (e^z - e^-z) / (e^z + e^-z)",
    note: "Squashes into -1 to 1 and is centred on zero.",
  },
};

export function activate(id: ActivationId, z: number): number {
  switch (id) {
    case "linear":
      return z;
    case "relu":
      return z > 0 ? z : 0;
    case "sigmoid":
      return 1 / (1 + Math.exp(-z));
    case "tanh":
      return Math.tanh(z);
  }
}

export interface Net {
  /** Layer sizes including the input layer: [inputs, ...layers]. */
  sizes: number[];
  /** Activation per non-input layer (index 0 is the first hidden layer). */
  activations: ActivationId[];
  /** weights[l][to][from] connects layer l (size sizes[l]) to layer l+1 (size sizes[l+1]). */
  weights: number[][][];
  /** biases[l][to] belongs to layer l+1. */
  biases: number[][];
  inputs: number[];
}

/** Decode the flat, scaled config arrays into a nested Net of real numbers. */
export function toNet(config: NnConfig): Net {
  const sizes = [config.inputs.length, ...config.layers.map((l) => l.size)];
  const weights: number[][][] = [];
  const biases: number[][] = [];
  let wi = 0;
  let bi = 0;
  for (let l = 0; l < config.layers.length; l++) {
    const from = sizes[l];
    const to = sizes[l + 1];
    const layerW: number[][] = [];
    for (let t = 0; t < to; t++) {
      const row: number[] = [];
      for (let f = 0; f < from; f++) row.push(config.w[wi++] / SCALE);
      layerW.push(row);
    }
    weights.push(layerW);
    const layerB: number[] = [];
    for (let t = 0; t < to; t++) layerB.push(config.b[bi++] / SCALE);
    biases.push(layerB);
  }
  return {
    sizes,
    activations: config.layers.map((l) => l.activation),
    weights,
    biases,
    inputs: config.inputs.map((v) => v / SCALE),
  };
}

/** One neuron's computation, with every number needed to explain it. */
export interface NeuronStep {
  /** 1-based layer index in the network (0 is the input layer). */
  layer: number;
  neuron: number;
  terms: { from: number; w: number; a: number }[];
  bias: number;
  z: number;
  activation: ActivationId;
  out: number;
}

export interface ForwardResult {
  /** activations[0] = inputs, activations[l] = outputs of layer l. */
  activations: number[][];
  /** Pre-activation sums z for layers 1..L (index 0 is layer 1). */
  pre: number[][];
  /** Every neuron in computation order (layer by layer, top to bottom). */
  steps: NeuronStep[];
}

export function forward(net: Net): ForwardResult {
  const activations: number[][] = [net.inputs.slice()];
  const pre: number[][] = [];
  const steps: NeuronStep[] = [];
  for (let l = 0; l < net.weights.length; l++) {
    const prev = activations[l];
    const outs: number[] = [];
    const zs: number[] = [];
    for (let t = 0; t < net.sizes[l + 1]; t++) {
      const terms = prev.map((a, f) => ({ from: f, w: net.weights[l][t][f], a }));
      let z = net.biases[l][t];
      // Fixed summation order (inputs first, bias last) keeps results reproducible.
      let sum = 0;
      for (const term of terms) sum += term.w * term.a;
      z = sum + net.biases[l][t];
      const out = activate(net.activations[l], z);
      zs.push(z);
      outs.push(out);
      steps.push({
        layer: l + 1,
        neuron: t,
        terms,
        bias: net.biases[l][t],
        z,
        activation: net.activations[l],
        out,
      });
    }
    pre.push(zs);
    activations.push(outs);
  }
  return { activations, pre, steps };
}

/** Number of neuron computations in a full forward pass. */
export function stepCount(net: Net): number {
  return net.sizes.slice(1).reduce((a, s) => a + s, 0);
}

/**
 * Activations known after the first `step` neuron computations. Entries not yet computed are
 * null; inputs are always known. A pure function of (net, step).
 */
export function activationsAt(net: Net, result: ForwardResult, step: number): (number | null)[][] {
  const out: (number | null)[][] = [result.activations[0].slice()];
  let n = 0;
  for (let l = 1; l < result.activations.length; l++) {
    out.push(result.activations[l].map((v) => (n++ < step ? v : null)));
  }
  return out;
}

const fmt = (x: number): string => {
  const s = (Math.abs(x) < 0.0005 ? 0 : x).toFixed(3);
  return s;
};

/** Plain-language explanation of one neuron's computation, with the real numbers. */
export function describeStep(step: NeuronStep, layerCount: number): string {
  const where = step.layer === layerCount ? "Output" : `Hidden layer ${step.layer}`;
  const parts = step.terms.map((t) => `${fmt(t.a)} × ${fmt(t.w)}`);
  const sum = parts.join(" + ");
  return `${where}, neuron ${step.neuron + 1}: z = ${sum} + bias ${fmt(step.bias)} = ${fmt(step.z)}. Then ${ACTIVATION_INFO[step.activation].name}(${fmt(step.z)}) = ${fmt(step.out)}.`;
}

export interface Prediction {
  values: number[];
  /** Index of the largest output. */
  best: number;
  summary: string;
}

export function predict(outputs: readonly number[], activation: ActivationId): Prediction {
  let best = 0;
  outputs.forEach((v, i) => {
    if (v > outputs[best]) best = i;
  });
  let summary: string;
  if (outputs.length === 1) {
    const v = outputs[0];
    summary =
      activation === "sigmoid"
        ? `Output ${fmt(v)}: read as a probability, ${v >= 0.5 ? "above" : "below"} 0.5, so the network says "yes" ${v >= 0.5 ? "(1)" : "(0)"}.`
        : `Output ${fmt(v)}. With a ${ACTIVATION_INFO[activation].name} output this is a plain number, not a probability.`;
  } else {
    summary = `Outputs ${outputs.map(fmt).join(", ")}. The largest is output ${best + 1}, so that is the network's pick.`;
  }
  return { values: outputs.slice(), best, summary };
}

/** Seeded small random parameters (Xavier-like uniform), already scaled and clamped to ints. */
function randomValue(rand: () => number, fanIn: number, fanOut: number): number {
  const limit = Math.sqrt(6 / (fanIn + fanOut));
  const v = (rand() * 2 - 1) * limit;
  return clamp(Math.round(v * SCALE), -PARAM_LIMIT, PARAM_LIMIT);
}
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Fully random parameters for an architecture. Same seed, same result. */
export function randomParams(inputCount: number, sizes: readonly number[], seed: number) {
  const rand = mulberry32(seed);
  const { weights, biases } = paramCounts(inputCount, sizes);
  const w: number[] = [];
  const b: number[] = [];
  let prev = inputCount;
  for (const s of sizes) {
    for (let i = 0; i < s * prev; i++) w.push(randomValue(rand, prev, s));
    for (let i = 0; i < s; i++) b.push(0); // biases start at zero, as is conventional
    prev = s;
  }
  if (w.length !== weights || b.length !== biases) throw new Error("parameter count mismatch");
  return { w, b };
}

/**
 * Change the architecture while keeping every parameter whose position still exists
 * (same layer, same neuron, same input). New positions get seeded small random weights and
 * zero biases, so editing the shape never throws away work the user has done.
 */
export function reshape(
  config: NnConfig,
  next: { inputCount: number; layers: NnConfig["layers"] },
): NnConfig {
  const inputCount = clamp(next.inputCount, 1, MAX_INPUTS);
  const layers = next.layers.slice(0, MAX_LAYERS).map((l) => ({
    size: clamp(l.size, 1, MAX_LAYER_SIZE),
    activation: l.activation,
  }));
  const old = toNet(config);
  const rand = mulberry32(config.seed);
  const w: number[] = [];
  const b: number[] = [];
  let prev = inputCount;
  for (let l = 0; l < layers.length; l++) {
    const to = layers[l].size;
    for (let t = 0; t < to; t++) {
      for (let f = 0; f < prev; f++) {
        const kept = old.weights[l]?.[t]?.[f];
        w.push(kept !== undefined ? Math.round(kept * SCALE) : randomValue(rand, prev, to));
      }
    }
    for (let t = 0; t < to; t++) {
      const kept = old.biases[l]?.[t];
      b.push(kept !== undefined ? Math.round(kept * SCALE) : 0);
    }
    prev = to;
  }
  const inputs = Array.from({ length: inputCount }, (_, i) => config.inputs[i] ?? 0);
  return { inputs, layers, w, b, seed: config.seed };
}
