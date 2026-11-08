/**
 * mulberry32: a tiny, fast, well-known 32-bit seeded PRNG. Identical output on
 * every JS engine because it uses only integer operations and Math.imul.
 * The core must never use Math.random, Date or performance (ADR 0002 D3).
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
