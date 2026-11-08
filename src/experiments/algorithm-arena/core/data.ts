import { mulberry32 } from "./prng";

export const PRESETS = ["random", "reversed", "nearly-sorted", "few-unique"] as const;
export type Preset = (typeof PRESETS)[number];

/** Deterministic input data: the same (preset, size, seed) always yields the same array. */
export function makeData(preset: Preset, size: number, seed: number): number[] {
  const rand = mulberry32(seed);
  const sorted = Array.from({ length: size }, (_, i) => i + 1);

  switch (preset) {
    case "reversed":
      return sorted.reverse();
    case "random": {
      // Fisher-Yates over 1..size: a permutation, so every value is distinct.
      for (let i = size - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
      }
      return sorted;
    }
    case "nearly-sorted": {
      const swaps = Math.max(1, Math.floor(size / 20));
      for (let k = 0; k < swaps; k++) {
        const i = Math.floor(rand() * size);
        const j = Math.floor(rand() * size);
        [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
      }
      return sorted;
    }
    case "few-unique": {
      const levels = 4;
      return Array.from({ length: size }, () => (Math.floor(rand() * levels) + 1) * (size / levels))
        .map(Math.round)
        .map((v) => Math.max(1, v));
    }
  }
}
