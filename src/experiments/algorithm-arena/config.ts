import { z } from "zod";
import { ALGORITHMS } from "./core/sorts";
import { PRESETS } from "./core/data";

import { MAX_SIZE, MAX_VALUE, MIN_SIZE } from "./limits";

export { MAX_SIZE, MAX_VALUE, MIN_SIZE };

/**
 * Shareable state of the Algorithm Arena: what to race and on what data.
 * Transient UI state (speed, playing, step) is deliberately NOT here.
 * `values`, when present, are explicit user-painted data and override the preset.
 */
export const arenaConfigSchema = z
  .strictObject({
    left: z.enum(ALGORITHMS),
    right: z.enum(ALGORITHMS),
    preset: z.enum(PRESETS),
    size: z.number().int().min(MIN_SIZE).max(MAX_SIZE),
    seed: z.number().int().min(0).max(0xffffffff),
    values: z.array(z.number().int().min(1).max(MAX_VALUE)).min(MIN_SIZE).max(MAX_SIZE).optional(),
  })
  .refine((c) => c.values === undefined || c.values.length === c.size, {
    message: "values length must equal size",
  });

export type ArenaConfig = z.infer<typeof arenaConfigSchema>;

export const defaultArenaConfig: ArenaConfig = {
  left: "bubble",
  right: "quick",
  preset: "random",
  size: 48,
  seed: 7,
};
