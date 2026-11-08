/**
 * mulberry32: a tiny, fast, well-known 32-bit seeded PRNG. Identical output on every JS
 * engine because it uses only integer operations and Math.imul. Experiment cores must use
 * this (via `@/engine/public`) and never Math.random, so seeds reproduce runs exactly.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
