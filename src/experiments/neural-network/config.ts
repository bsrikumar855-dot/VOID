import { z } from "zod";
import {
  ACTIVATIONS,
  INPUT_LIMIT,
  MAX_INPUTS,
  MAX_LAYERS,
  MAX_LAYER_SIZE,
  PARAM_LIMIT,
  paramCounts,
} from "./limits";

/**
 * Shareable state of the Neural Network Playground: the network (architecture, weights,
 * biases) and the input vector. Transient UI state (step, playing, selection) is not here.
 * Constants and the default network live in ./limits (no runtime imports, no Zod).
 */
export {
  ACTIVATIONS,
  INPUT_LIMIT,
  MAX_INPUTS,
  MAX_LAYERS,
  MAX_LAYER_SIZE,
  PARAM_LIMIT,
  SCALE,
  defaultNnConfig,
  paramCounts,
} from "./limits";
export type { ActivationId } from "./limits";

const layerSchema = z.strictObject({
  size: z.number().int().min(1).max(MAX_LAYER_SIZE),
  activation: z.enum(ACTIVATIONS),
});

const maxWeights = paramCounts(MAX_INPUTS, Array(MAX_LAYERS).fill(MAX_LAYER_SIZE)).weights;
const maxBiases = MAX_LAYERS * MAX_LAYER_SIZE;

export const nnConfigSchema = z
  .strictObject({
    inputs: z.array(z.number().int().min(-INPUT_LIMIT).max(INPUT_LIMIT)).min(1).max(MAX_INPUTS),
    layers: z.array(layerSchema).min(1).max(MAX_LAYERS),
    w: z.array(z.number().int().min(-PARAM_LIMIT).max(PARAM_LIMIT)).max(maxWeights),
    b: z.array(z.number().int().min(-PARAM_LIMIT).max(PARAM_LIMIT)).max(maxBiases),
    seed: z.number().int().min(0).max(0xffffffff),
  })
  .refine(
    (c) => {
      const { weights, biases } = paramCounts(
        c.inputs.length,
        c.layers.map((l) => l.size),
      );
      return c.w.length === weights && c.b.length === biases;
    },
    { message: "weights and biases must match the architecture" },
  );

export type NnConfig = z.infer<typeof nnConfigSchema>;
