import { describe, expect, it } from "vitest";
import { forward, predict, toNet } from "@/experiments/neural-network/core/network";
import { neuralNetwork } from "@/experiments/neural-network/manifest";
import type { NnConfig } from "@/experiments/neural-network/config";

/**
 * The homepage and Explore show each example's note as fact, so every claim is checked
 * against the real computation here.
 */
const examples = neuralNetwork.examples ?? [];
const out = (c: NnConfig) => forward(toNet(c)).activations.at(-1)!;
const withInputs = (c: NnConfig, inputs: number[]): NnConfig => ({ ...c, inputs });

describe("Neural Network curated examples", () => {
  it("has the three documented examples, all valid", () => {
    expect(examples.map((e) => e.title)).toEqual([
      "XOR, built by hand",
      "One neuron as an AND gate",
      "Picking one of two outputs",
    ]);
    for (const e of examples)
      expect(neuralNetwork.configSchema.safeParse(e.config).success).toBe(true);
  });

  it("XOR example: both inputs 1 gives hidden values 2 and 1 and output 2 - 2*1 = 0", () => {
    const r = forward(toNet(examples[0].config));
    expect(r.activations[1]).toEqual([2, 1]);
    expect(r.activations[2]).toEqual([0]);
  });

  it("XOR example: the four binary inputs give 0, 1, 1, 0", () => {
    const cfg = examples[0].config;
    const results = [
      [0, 0],
      [100, 0],
      [0, 100],
      [100, 100],
    ].map((i) => out(withInputs(cfg, i))[0]);
    expect(results).toEqual([0, 1, 1, 0]);
  });

  it("AND example: above 0.5 only when both inputs are 1", () => {
    const cfg = examples[1].config;
    const above = [
      [0, 0],
      [100, 0],
      [0, 100],
      [100, 100],
    ].map((i) => out(withInputs(cfg, i))[0] > 0.5);
    expect(above).toEqual([false, false, false, true]);
  });

  it("two-output example: output 2 is the largest", () => {
    const outputs = out(examples[2].config);
    expect(outputs).toHaveLength(2);
    expect(predict(outputs, "linear").best).toBe(1);
  });
});
