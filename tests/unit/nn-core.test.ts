import { describe, expect, it } from "vitest";
import {
  ACTIVATIONS,
  MAX_INPUTS,
  MAX_LAYERS,
  MAX_LAYER_SIZE,
  defaultNnConfig,
  nnConfigSchema,
  paramCounts,
  type NnConfig,
} from "@/experiments/neural-network/config";
import {
  activate,
  activationsAt,
  describeStep,
  forward,
  predict,
  randomParams,
  reshape,
  stepCount,
  toNet,
} from "@/experiments/neural-network/core/network";
import { mulberry32 } from "@/engine/public";

const run = (c: NnConfig) => forward(toNet(c));
const outputOf = (c: NnConfig) => run(c).activations.at(-1)!;
const withInputs = (c: NnConfig, inputs: number[]): NnConfig => ({ ...c, inputs });

describe("activation functions (reference values from an independent Python implementation)", () => {
  it("linear and relu are exact", () => {
    expect(activate("linear", -2.5)).toBe(-2.5);
    expect(activate("relu", -2)).toBe(0);
    expect(activate("relu", 0)).toBe(0);
    expect(activate("relu", 3.5)).toBe(3.5);
  });
  it("sigmoid", () => {
    expect(activate("sigmoid", 0)).toBe(0.5);
    expect(activate("sigmoid", 1)).toBeCloseTo(0.7310585786300049, 12);
    expect(activate("sigmoid", Math.log(3))).toBeCloseTo(0.75, 12);
    expect(activate("sigmoid", -50)).toBeLessThan(1e-20);
    expect(activate("sigmoid", 50)).toBeCloseTo(1, 12);
    // symmetry: s(-z) = 1 - s(z)
    expect(activate("sigmoid", -0.7) + activate("sigmoid", 0.7)).toBeCloseTo(1, 12);
  });
  it("tanh", () => {
    expect(activate("tanh", 0)).toBe(0);
    expect(activate("tanh", 1)).toBeCloseTo(0.7615941559557649, 12);
    expect(activate("tanh", -0.4)).toBeCloseTo(-0.3799489622552249, 12);
    expect(activate("tanh", 100)).toBeCloseTo(1, 12);
  });
  it("handles every activation at extreme inputs without NaN or Infinity", () => {
    for (const id of ACTIVATIONS) {
      for (const z of [-1e6, -5, 0, 5, 1e6])
        expect(Number.isFinite(activate(id, z)), `${id}(${z})`).toBe(true);
    }
  });
});

describe("hand-built XOR network (the default configuration)", () => {
  it("the default config passes its own schema", () => {
    expect(nnConfigSchema.safeParse(defaultNnConfig).success).toBe(true);
  });

  // y = relu(x1 + x2) - 2 * relu(x1 + x2 - 1), computed by hand:
  const table: Array<[number[], number]> = [
    [[0, 0], 0],
    [[100, 0], 1],
    [[0, 100], 1],
    [[100, 100], 0],
  ];
  it.each(table)("inputs %j -> output %d (the XOR truth table)", (inputs, expected) => {
    expect(outputOf(withInputs(defaultNnConfig, inputs))[0]).toBeCloseTo(expected, 12);
  });

  it("(1,1): hidden values are 2 and 1, output 2 - 2*1 = 0 (each stage checked by hand)", () => {
    const r = run(withInputs(defaultNnConfig, [100, 100]));
    expect(r.pre[0]).toEqual([2, 1]); // z of h1 = 1+1, z of h2 = 1+1-1
    expect(r.activations[1]).toEqual([2, 1]);
    expect(r.pre[1]).toEqual([0]); // 1*2 + (-2)*1 + 0
  });

  it("is not a trivially linear model: f(1,1) != f(1,0) + f(0,1) - f(0,0)", () => {
    const f = (a: number, b: number) => outputOf(withInputs(defaultNnConfig, [a, b]))[0];
    expect(f(100, 100)).not.toBeCloseTo(f(100, 0) + f(0, 100) - f(0, 0), 6);
  });
});

describe("two reference networks cross-checked against Python", () => {
  const netA: NnConfig = {
    inputs: [50, -100],
    layers: [
      { size: 2, activation: "tanh" },
      { size: 1, activation: "sigmoid" },
    ],
    w: [40, 20, -60, 10, 50, -25],
    b: [10, 0, 20],
    seed: 0,
  };
  const netB: NnConfig = {
    inputs: [100, 50, -50],
    layers: [
      { size: 3, activation: "relu" },
      { size: 2, activation: "linear" },
    ],
    w: [20, -40, 60, 50, 50, 50, -100, 30, 10, 100, -100, 50, -50, 200, 100],
    b: [0, -20, 30, 10, -10],
    seed: 0,
  };

  it("2-2-1 tanh/sigmoid", () => {
    const r = run(netA);
    expect(r.pre[0][0]).toBeCloseTo(0.1, 12);
    expect(r.pre[0][1]).toBeCloseTo(-0.4, 12);
    expect(r.activations[1][0]).toBeCloseTo(0.09966799462495582, 12);
    expect(r.activations[1][1]).toBeCloseTo(-0.3799489622552249, 12);
    expect(r.pre[1][0]).toBeCloseTo(0.34482123787628416, 12);
    expect(r.activations[2][0]).toBeCloseTo(0.5853611818165343, 12);
  });

  it("3-3-2 relu/linear, and the prediction picks output 2", () => {
    const r = run(netB);
    expect(r.pre[0][0]).toBeCloseTo(-0.3, 12);
    expect(r.pre[0][1]).toBeCloseTo(0.3, 12);
    expect(r.pre[0][2]).toBeCloseTo(-0.6, 12);
    expect(r.activations[1]).toEqual([0, r.activations[1][1], 0]);
    expect(r.activations[2][0]).toBeCloseTo(-0.2, 12);
    expect(r.activations[2][1]).toBeCloseTo(0.5, 12);
    const p = predict(r.activations[2], "linear");
    expect(p.best).toBe(1);
    expect(p.summary).toContain("output 2");
  });
});

/** An independent evaluator that works directly on the flat arrays, to check toNet's layout. */
function flatEvaluate(c: NnConfig): number[] {
  let a = c.inputs.map((v) => v / 100);
  let prev = c.inputs.length;
  let wo = 0;
  let bo = 0;
  for (const layer of c.layers) {
    const next: number[] = [];
    for (let t = 0; t < layer.size; t++) {
      let z = c.b[bo + t] / 100;
      for (let f = 0; f < prev; f++) z += (c.w[wo + t * prev + f] / 100) * a[f];
      next.push(activate(layer.activation, z));
    }
    wo += layer.size * prev;
    bo += layer.size;
    a = next;
    prev = layer.size;
  }
  return a;
}

describe("weight layout (property test over seeded random architectures)", () => {
  it("toNet + forward equals an independent flat-index evaluator for 300 random networks", () => {
    const rand = mulberry32(2026);
    for (let i = 0; i < 300; i++) {
      const nIn = 1 + Math.floor(rand() * MAX_INPUTS);
      const nLayers = 1 + Math.floor(rand() * MAX_LAYERS);
      const layers = Array.from({ length: nLayers }, () => ({
        size: 1 + Math.floor(rand() * MAX_LAYER_SIZE),
        activation: ACTIVATIONS[Math.floor(rand() * ACTIVATIONS.length)],
      }));
      const { w, b } = randomParams(
        nIn,
        layers.map((l) => l.size),
        i,
      );
      // give biases non-zero values too
      const b2 = b.map(() => Math.round((rand() * 2 - 1) * 100));
      const inputs = Array.from({ length: nIn }, () => Math.round((rand() * 2 - 1) * 200));
      const cfg: NnConfig = { inputs, layers, w, b: b2, seed: i };
      expect(nnConfigSchema.safeParse(cfg).success).toBe(true);
      const got = outputOf(cfg);
      const want = flatEvaluate(cfg);
      expect(got.length).toBe(want.length);
      got.forEach((v, k) => expect(v).toBeCloseTo(want[k], 12));
    }
  });
});

describe("step-by-step execution", () => {
  const cfg = withInputs(defaultNnConfig, [100, 100]);
  const net = toNet(cfg);
  const result = forward(net);

  it("one step per non-input neuron, in layer order", () => {
    expect(stepCount(net)).toBe(3);
    expect(result.steps.map((s) => [s.layer, s.neuron])).toEqual([
      [1, 0],
      [1, 1],
      [2, 0],
    ]);
  });
  it("step 0 knows only the inputs; the last step equals the full forward pass", () => {
    const first = activationsAt(net, result, 0);
    expect(first[0]).toEqual([1, 1]);
    expect(first[1]).toEqual([null, null]);
    expect(first[2]).toEqual([null]);
    expect(activationsAt(net, result, stepCount(net))).toEqual(result.activations);
  });
  it("reveals exactly one more neuron per step", () => {
    let known = 0;
    for (let s = 0; s <= stepCount(net); s++) {
      const a = activationsAt(net, result, s);
      const now = a
        .slice(1)
        .flat()
        .filter((v) => v !== null).length;
      expect(now).toBeGreaterThanOrEqual(known);
      expect(now).toBe(s);
      known = now;
    }
  });
  it("the explanation of a step quotes the real numbers", () => {
    const text = describeStep(result.steps[2], 2);
    expect(text).toContain("Output, neuron 1");
    expect(text).toContain("2.000 × 1.000"); // h1 = 2 times weight 1
    expect(text).toContain("1.000 × -2.000"); // h2 = 1 times weight -2
    expect(text).toContain("= 0.000");
    expect(text).toContain("Linear(0.000) = 0.000");
  });
  it("never prints a negative zero", () => {
    const tiny = { ...result.steps[0], z: -0.0001, out: -0.0001, bias: -0.0001 };
    expect(describeStep(tiny, 2)).not.toContain("-0.000");
  });
});

describe("prediction wording", () => {
  it("single sigmoid output reads as a probability with the right side of 0.5", () => {
    expect(predict([0.7], "sigmoid").summary).toContain("above 0.5");
    expect(predict([0.2], "sigmoid").summary).toContain("below 0.5");
  });
  it("single non-sigmoid output is a plain number, not a probability", () => {
    expect(predict([1.2], "relu").summary).toContain("plain number");
  });
  it("exactly 0.5 is stated as the boundary, not as above or below", () => {
    const s = predict([0.5], "sigmoid").summary;
    expect(s).toContain("exactly 0.5");
    expect(s).not.toContain("above");
    expect(s).not.toContain("below");
  });
  it("ties go to the first output", () => {
    expect(predict([0.5, 0.5], "linear").best).toBe(0);
  });
});

describe("schema (shared links are untrusted)", () => {
  const ok = (c: unknown) => nnConfigSchema.safeParse(c).success;
  it("rejects a weight array that does not match the architecture", () => {
    expect(ok({ ...defaultNnConfig, w: defaultNnConfig.w.slice(1) })).toBe(false);
    expect(ok({ ...defaultNnConfig, b: [...defaultNnConfig.b, 0] })).toBe(false);
  });
  it("rejects out-of-range, non-integer and non-number values", () => {
    expect(ok({ ...defaultNnConfig, w: [501, ...defaultNnConfig.w.slice(1)] })).toBe(false);
    expect(ok({ ...defaultNnConfig, w: [1.5, ...defaultNnConfig.w.slice(1)] })).toBe(false);
    expect(ok({ ...defaultNnConfig, inputs: [201, 0] })).toBe(false);
    expect(ok({ ...defaultNnConfig, inputs: ["1", 0] })).toBe(false);
    expect(ok({ ...defaultNnConfig, seed: -1 })).toBe(false);
  });
  it("enforces architecture limits", () => {
    expect(ok({ ...defaultNnConfig, inputs: [0, 0, 0, 0] })).toBe(false);
    expect(ok({ ...defaultNnConfig, inputs: [] })).toBe(false);
    expect(ok({ ...defaultNnConfig, layers: [] })).toBe(false);
    expect(ok({ ...defaultNnConfig, layers: [{ size: 7, activation: "relu" }] })).toBe(false);
    expect(ok({ ...defaultNnConfig, layers: [{ size: 2, activation: "softmax" }] })).toBe(false);
  });
  it("rejects unknown keys, including __proto__", () => {
    expect(ok({ ...defaultNnConfig, evil: 1 })).toBe(false);
    expect(
      ok(
        JSON.parse(
          '{"inputs":[0],"layers":[{"size":1,"activation":"relu"}],"w":[0],"b":[0],"seed":0,"__proto__":{"x":1}}',
        ),
      ),
    ).toBe(false);
  });
  it("accepts the largest allowed architecture", () => {
    const sizes = Array(MAX_LAYERS).fill(MAX_LAYER_SIZE);
    const { w, b } = randomParams(MAX_INPUTS, sizes, 1);
    const cfg = {
      inputs: [0, 0, 0],
      layers: sizes.map((size) => ({ size, activation: "tanh" as const })),
      w,
      b,
      seed: 1,
    };
    expect(ok(cfg)).toBe(true);
    expect(w.length).toBe(paramCounts(MAX_INPUTS, sizes).weights);
  });
});

describe("randomParams and reshape", () => {
  it("random parameters are deterministic per seed, bounded, and sized to the architecture", () => {
    const a = randomParams(3, [4, 2], 99);
    expect(randomParams(3, [4, 2], 99)).toEqual(a);
    expect(randomParams(3, [4, 2], 100)).not.toEqual(a);
    expect(a.w).toHaveLength(3 * 4 + 4 * 2);
    expect(a.b).toEqual([0, 0, 0, 0, 0, 0]);
    expect(a.w.every((v) => Number.isInteger(v) && Math.abs(v) <= 500)).toBe(true);
  });

  it("adding a hidden neuron keeps every existing weight and bias in place", () => {
    const grown = reshape(defaultNnConfig, {
      inputCount: 2,
      layers: [
        { size: 3, activation: "relu" },
        { size: 1, activation: "linear" },
      ],
    });
    expect(nnConfigSchema.safeParse(grown).success).toBe(true);
    const before = toNet(defaultNnConfig);
    const after = toNet(grown);
    // layer 1 neurons 0 and 1 are untouched
    expect(after.weights[0][0]).toEqual(before.weights[0][0]);
    expect(after.weights[0][1]).toEqual(before.weights[0][1]);
    expect(after.biases[0].slice(0, 2)).toEqual(before.biases[0]);
    // the output neuron keeps its weights from h1 and h2; the new h3 weight is a new random value
    expect(after.weights[1][0].slice(0, 2)).toEqual(before.weights[1][0]);
    expect(after.weights[1][0]).toHaveLength(3);
    expect(after.biases[1]).toEqual(before.biases[1]);
  });

  it("removing a neuron drops only its parameters", () => {
    const shrunk = reshape(defaultNnConfig, {
      inputCount: 2,
      layers: [
        { size: 1, activation: "relu" },
        { size: 1, activation: "linear" },
      ],
    });
    expect(nnConfigSchema.safeParse(shrunk).success).toBe(true);
    const after = toNet(shrunk);
    expect(after.weights[0][0]).toEqual([1, 1]);
    expect(after.weights[1][0]).toEqual([1]);
  });

  it("inserting a hidden layer keeps the layers around it in place (explicit layer mapping)", () => {
    const layers = [
      { size: 2, activation: "relu" as const },
      { size: 3, activation: "relu" as const },
      { size: 1, activation: "linear" as const },
    ];
    const grown = reshape(defaultNnConfig, { inputCount: 2, layers, from: [0, null, 1] });
    expect(nnConfigSchema.safeParse(grown).success).toBe(true);
    const before = toNet(defaultNnConfig);
    const after = toNet(grown);
    // hidden layer 1 is exactly the old hidden layer
    expect(after.weights[0]).toEqual(before.weights[0]);
    expect(after.biases[0]).toEqual(before.biases[0]);
    // the output keeps its bias and the weights from the neurons that still exist
    expect(after.biases[2]).toEqual(before.biases[1]);
    expect(after.weights[2][0].slice(0, 2)).toEqual(before.weights[1][0]);
    // the new layer has zero biases and its own (random) weights
    expect(after.biases[1]).toEqual([0, 0, 0]);
    // without the mapping the old behaviour would have shifted the output's weights
    const shifted = toNet(reshape(defaultNnConfig, { inputCount: 2, layers }));
    expect(shifted.weights[2][0].slice(0, 2)).not.toEqual(before.weights[1][0]);
  });

  it("removing a hidden layer keeps the other layers' parameters (explicit layer mapping)", () => {
    const three = reshape(defaultNnConfig, {
      inputCount: 2,
      layers: [
        { size: 2, activation: "relu" },
        { size: 2, activation: "tanh" },
        { size: 1, activation: "linear" },
      ],
      from: [0, null, 1],
    });
    const without = reshape(three, {
      inputCount: 2,
      layers: [three.layers[0], three.layers[2]],
      from: [0, 2],
    });
    const a = toNet(three);
    const b = toNet(without);
    expect(b.weights[0]).toEqual(a.weights[0]);
    expect(b.biases[0]).toEqual(a.biases[0]);
    expect(b.biases[1]).toEqual(a.biases[2]);
    expect(nnConfigSchema.safeParse(without).success).toBe(true);
  });

  it("changing the input count adjusts inputs and first-layer weights, keeping the rest", () => {
    const three = reshape(defaultNnConfig, { inputCount: 3, layers: defaultNnConfig.layers });
    expect(three.inputs).toEqual([100, 0, 0]);
    expect(nnConfigSchema.safeParse(three).success).toBe(true);
    const one = reshape(defaultNnConfig, { inputCount: 1, layers: defaultNnConfig.layers });
    expect(one.inputs).toEqual([100]);
    expect(nnConfigSchema.safeParse(one).success).toBe(true);
  });

  it("is deterministic and always produces a valid config, for 200 random reshapes", () => {
    const rand = mulberry32(7);
    for (let i = 0; i < 200; i++) {
      const layers = Array.from({ length: 1 + Math.floor(rand() * MAX_LAYERS) }, () => ({
        size: 1 + Math.floor(rand() * MAX_LAYER_SIZE),
        activation: ACTIVATIONS[Math.floor(rand() * ACTIVATIONS.length)],
      }));
      const next = { inputCount: 1 + Math.floor(rand() * MAX_INPUTS), layers };
      const a = reshape(defaultNnConfig, next);
      expect(nnConfigSchema.safeParse(a).success).toBe(true);
      expect(reshape(defaultNnConfig, next)).toEqual(a);
    }
  });
});
