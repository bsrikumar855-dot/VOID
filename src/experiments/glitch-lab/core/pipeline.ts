import type { GlitchConfig } from "../config";
import { BLOCK_H, IMAGE_SIZE as N, MAX_BLOCK_PX, MAX_SHIFT_PX, WAVE_PERIOD } from "../limits";
import { hash4 } from "./hash";

/**
 * The reference implementation of the glitch pipeline: pure, integer-only, deterministic.
 * The WebGL fragment shader in view/gl.ts is a line-by-line port of renderPixel's arithmetic,
 * and the end-to-end tests assert that the GPU's pixels equal this function's pixels.
 *
 * Order of operations for output pixel (x, y), y counted from the top:
 *   1. block displacement   rows are cut into BLOCK_H-row blocks; a seeded share of blocks slide sideways
 *   2. wave                 a triangle wave in y shifts every row sideways
 *   3. colour split         red is read `shift` pixels left, blue `shift` pixels right of the base position
 *   4. posterize            each channel is rounded to `levels` evenly spaced values
 *   5. noise                one seeded value per pixel is added to all three channels
 *   6. scanlines            every second row is darkened
 * Source reads clamp at the image edge.
 */
export interface PipelineParams {
  /** Red/blue read offset in pixels. */
  shiftPx: number;
  /** 0..100: share of blocks that move (at most half of them). */
  blocks: number;
  /** Largest block displacement in pixels. */
  blockAmp: number;
  wave: number;
  /** 0 = off, else 2..16. */
  levels: number;
  noise: number;
  /** Percent of brightness kept on odd rows. */
  scanFactor: number;
  seed: number;
  phase: number;
  /** Blocks re-roll every second frame. */
  blockFrame: number;
}

export function toParams(c: GlitchConfig): PipelineParams {
  return {
    shiftPx: Math.floor((c.shift * MAX_SHIFT_PX) / 100),
    blocks: c.blocks,
    blockAmp: Math.floor((c.blocks * MAX_BLOCK_PX) / 100),
    wave: c.wave,
    levels: c.posterize,
    noise: c.noise,
    scanFactor: 100 - Math.floor((c.scan * 60) / 100),
    seed: c.seed,
    phase: c.phase,
    blockFrame: c.phase >> 1,
  };
}

/** Integer division truncating toward zero (GLSL leaves negative division unspecified). */
const divT = (a: number, b: number) => Math.trunc(a / b);
const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/** Sideways displacement of block row `by` (0 when the block is not selected). */
export function blockOffset(p: PipelineParams, by: number): number {
  const h = hash4(by, p.seed, p.blockFrame, 1);
  if ((h & 255) * 100 >= p.blocks * 128) return 0;
  const mag = (h >>> 8) & 255;
  return divT((mag - 128) * p.blockAmp, 128);
}

/** Sideways displacement of row y from the triangle wave. */
export function waveOffset(p: PipelineParams, y: number): number {
  const tri = Math.abs(((y + p.phase * 2) % WAVE_PERIOD) - WAVE_PERIOD / 2);
  // tri runs 0..WAVE_PERIOD/2; centre it, scale so wave = 100 gives +-MAX_WAVE_PX.
  return divT((tri - WAVE_PERIOD / 4) * p.wave * 3, 200);
}

/** One output pixel's [r, g, b]. */
export function renderPixel(
  src: ArrayLike<number>,
  p: PipelineParams,
  x: number,
  y: number,
  rowOffset: number,
  out: number[],
): void {
  const base = x + rowOffset;
  for (let c = 0; c < 3; c++) {
    const sx = clamp(base + (c - 1) * p.shiftPx, 0, N - 1);
    let v = src[(y * N + sx) * 4 + c];
    if (p.levels >= 2) {
      const l1 = p.levels - 1;
      const q = Math.floor((v * l1 * 2 + 255) / 510);
      v = Math.floor((q * 510 + l1) / (2 * l1));
    }
    out[c] = v;
  }
  if (p.noise > 0) {
    const n = (hash4(x, y, p.seed, p.phase + 7) & 255) - 128;
    const add = divT(n * p.noise, 100);
    for (let c = 0; c < 3; c++) out[c] = clamp(out[c] + add, 0, 255);
  }
  if ((y & 1) === 1) {
    for (let c = 0; c < 3; c++) out[c] = Math.floor((out[c] * p.scanFactor) / 100);
  }
}

/** The whole image, RGBA, alpha 255. */
export function renderReference(src: ArrayLike<number>, config: GlitchConfig): Uint8ClampedArray {
  const p = toParams(config);
  const out = new Uint8ClampedArray(N * N * 4);
  const px = [0, 0, 0];
  for (let y = 0; y < N; y++) {
    const rowOffset = blockOffset(p, Math.floor(y / BLOCK_H)) + waveOffset(p, y);
    for (let x = 0; x < N; x++) {
      renderPixel(src, p, x, y, rowOffset, px);
      const i = (y * N + x) * 4;
      out[i] = px[0];
      out[i + 1] = px[1];
      out[i + 2] = px[2];
      out[i + 3] = 255;
    }
  }
  return out;
}
