import type { GlitchConfig } from "./config";

/**
 * Constants and the default configuration, in a module with NO runtime imports (the
 * GlitchConfig import is type-only). The view and the pure core import from here, never from
 * config.ts (which builds the Zod schema), so Zod stays out of the view's JavaScript.
 *
 * Every number in a config is an integer. The whole effect pipeline (core/pipeline.ts and the
 * fragment shader in view/gl.ts) uses integer arithmetic only, so the GPU, the CPU fallback and
 * the unit tests produce the SAME pixels, and a share link names one exact image.
 */
export const SOURCES = ["bars", "rings", "grid", "gradient"] as const;
export type SourceId = (typeof SOURCES)[number];

/** The image is IMAGE_SIZE x IMAGE_SIZE pixels, always. Export is the same size. */
export const IMAGE_SIZE = 512;
export const SEED_MAX = 9999;
/** Frame numbers run 0..PHASE_MAX and wrap. */
export const PHASE_MAX = 9999;
export const EFFECT_MAX = 100;
/** Posterize levels per channel: 0 = off, otherwise 2..MAX_POSTERIZE. */
export const MAX_POSTERIZE = 16;

/** Pipeline geometry (shared by the CPU reference and the shader). */
export const BLOCK_H = 16; // rows per displaceable block
export const WAVE_PERIOD = 64; // rows per wave cycle (triangle wave)
export const MAX_SHIFT_PX = 24; // colour split at shift = 100
export const MAX_BLOCK_PX = 64; // block displacement amplitude at blocks = 100
export const MAX_WAVE_PX = 24; // wave displacement amplitude at wave = 100
export const FPS = 12; // animation frames per second

/** The effects the user can dial, in pipeline order of application (see core/pipeline.ts). */
export const EFFECT_KEYS = ["blocks", "wave", "shift", "noise", "scan"] as const;
export type EffectKey = (typeof EFFECT_KEYS)[number];

export const defaultGlitchConfig: GlitchConfig = {
  source: "bars",
  seed: 1,
  phase: 0,
  blocks: 20,
  wave: 15,
  shift: 30,
  noise: 10,
  scan: 25,
  posterize: 0,
};
