import { z } from "zod";
import { EFFECT_MAX, MAX_POSTERIZE, PHASE_MAX, SEED_MAX, SOURCES } from "./limits";

/**
 * Shareable state of Glitch Lab: which test image, the seed, the frame number and the strength
 * of each effect. Transient UI state (playing, export status) is not here. The frame number IS
 * here, so a link reproduces one exact frame of an animation.
 * Constants and the default configuration live in ./limits (no runtime imports, no Zod).
 */
export * from "./limits";

const effect = z.number().int().min(0).max(EFFECT_MAX);

export const glitchConfigSchema = z.strictObject({
  source: z.enum(SOURCES),
  seed: z.number().int().min(0).max(SEED_MAX),
  phase: z.number().int().min(0).max(PHASE_MAX),
  blocks: effect,
  wave: effect,
  shift: effect,
  noise: effect,
  scan: effect,
  // 0 = off; a single level (1) is meaningless, so 2..MAX_POSTERIZE.
  posterize: z
    .number()
    .int()
    .min(0)
    .max(MAX_POSTERIZE)
    .refine((v) => v !== 1, { message: "posterize is 0 (off) or 2 to 16 levels" }),
});

export type GlitchConfig = z.infer<typeof glitchConfigSchema>;
