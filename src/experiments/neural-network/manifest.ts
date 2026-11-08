import { defineExperiment } from "@/engine/public";
import { defaultNnConfig, nnConfigSchema, type NnConfig } from "./config";

export const neuralNetwork = defineExperiment<NnConfig>({
  meta: {
    id: "neural-network",
    slug: "neural-network",
    title: "Neural Network Playground",
    summary:
      "Build a small neural network, set its weights, and watch each neuron compute its value one step at a time.",
    category: "Machine learning",
    tags: ["neural networks", "activation functions", "forward propagation"],
    version: 1,
  },
  configSchema: nnConfigSchema,
  defaultConfig: defaultNnConfig,
  examples: [
    {
      title: "XOR, built by hand",
      note: "Two ReLU neurons and one linear output compute XOR. With both inputs at 1 the hidden neurons are 2 and 1, so the output is 2 - 2 × 1 = 0. Use the four input presets to see 0, 1, 1, 0.",
      config: { ...defaultNnConfig, inputs: [100, 100] },
    },
    {
      title: "One neuron as an AND gate",
      note: "A single sigmoid neuron with weights 3 and 3 and bias -4.5 is above 0.5 only when both inputs are 1.",
      config: {
        inputs: [100, 100],
        layers: [{ size: 1, activation: "sigmoid" }],
        w: [300, 300],
        b: [-450],
        seed: 1,
      },
    },
    {
      title: "Picking one of two outputs",
      note: "With several outputs the network's pick is the largest one. Here output 2 wins.",
      config: {
        inputs: [100, 50, -50],
        layers: [
          { size: 3, activation: "relu" },
          { size: 2, activation: "linear" },
        ],
        w: [20, -40, 60, 50, 50, 50, -100, 30, 10, 100, -100, 50, -50, 200, 100],
        b: [0, -20, 30, 10, -10],
        seed: 1,
      },
    },
  ],
});
