/**
 * PCG hash on 32-bit unsigned integers. The fragment shader (view/gl.ts) contains the same
 * function in GLSL, where `uint` arithmetic wraps modulo 2^32 exactly as Math.imul and `>>> 0`
 * do here. Integer hashing (instead of the usual fract(sin(...)) trick) is what makes the GPU
 * and CPU outputs identical: float transcendental functions differ between GPUs.
 */
export function pcg(v: number): number {
  const state = (Math.imul(v >>> 0, 747796405) + 2891336453) >>> 0;
  const shift = (state >>> 28) + 4; // 4..19, always below 32
  const word = Math.imul(((state >>> shift) ^ state) >>> 0, 277803737) >>> 0;
  return ((word >>> 22) ^ word) >>> 0;
}

/** Hash four non-negative integers into one uint32. */
export function hash4(a: number, b: number, c: number, d: number): number {
  return pcg((a + pcg((b + pcg((c + pcg(d)) >>> 0)) >>> 0)) >>> 0);
}
