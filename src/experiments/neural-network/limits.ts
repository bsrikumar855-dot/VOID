import type { NnConfig } from "./config";

/**
 * Constants, parameter arithmetic and the default network, in a module with NO runtime
 * imports (the NnConfig import is type-only). The client view and the pure core import from
 * here, never from config.ts (which defines the Zod schema), so Zod stays out of the view's
 * JavaScript (see docs/perf).
 *
 * All numbers in a config are integers scaled by 100 so share links are compact and exact:
 * a weight of -0.35 is stored as -35. Weights live in one flat array, layer by layer,
 * row-major [to][from]; see core/network.ts for the layout.
 */
export const SCALE = 100;
export const ACTIVATIONS = ["linear", "relu", "sigmoid", "tanh"] as const;
export type ActivationId = (typeof ACTIVATIONS)[number];

export const MAX_INPUTS = 3;
export const MAX_LAYERS = 4; // hidden layers plus the output layer
export const MAX_LAYER_SIZE = 6;
export const INPUT_LIMIT = 200; // inputs in [-2, 2]
export const PARAM_LIMIT = 500; // weights and biases in [-5, 5]

/** Parameter counts implied by an architecture (input count + layer sizes). */
export function paramCounts(inputCount: number, sizes: readonly number[]) {
  let weights = 0;
  let prev = inputCount;
  for (const s of sizes) {
    weights += s * prev;
    prev = s;
  }
  return { weights, biases: sizes.reduce((a, s) => a + s, 0) };
}

/**
 * Hand-built XOR network (the default). Hidden: h1 = relu(x1 + x2), h2 = relu(x1 + x2 - 1).
 * Output (linear): y = h1 - 2*h2. For binary inputs: (0,0)->0, (1,0)->1, (0,1)->1, (1,1)->0.
 * Verified by hand in tests/unit/nn-core.test.ts.
 */
export const defaultNnConfig: NnConfig = {
  inputs: [100, 0],
  layers: [
    { size: 2, activation: "relu" },
    { size: 1, activation: "linear" },
  ],
  // layer 1 (2 neurons x 2 inputs): [h1<-x1, h1<-x2, h2<-x1, h2<-x2]; layer 2 (1 x 2): [y<-h1, y<-h2]
  w: [100, 100, 100, 100, 100, -200],
  // h1 bias 0, h2 bias -1, y bias 0
  b: [0, -100, 0],
  seed: 1,
};
