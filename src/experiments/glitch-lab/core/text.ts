import type { GlitchConfig } from "../config";
import { EFFECT_KEYS, type EffectKey } from "../limits";

export const EFFECT_INFO: Record<EffectKey, { label: string; help: string }> = {
  blocks: {
    label: "Torn rows",
    help: "Cuts the image into 16-row bands and slides some of them sideways.",
  },
  wave: {
    label: "Wave",
    help: "Pushes every row sideways along a zig-zag, so vertical lines bend.",
  },
  shift: {
    label: "Colour split",
    help: "Reads red from the left and blue from the right of each pixel, leaving green in place.",
  },
  noise: {
    label: "Noise",
    help: "Adds a different random amount to every pixel, the same for red, green and blue.",
  },
  scan: {
    label: "Scanlines",
    help: "Darkens every second row.",
  },
};

export const SOURCE_LABELS = {
  bars: "Colour bars",
  rings: "Rings",
  grid: "Grid",
  gradient: "Gradient",
} as const;

/** One stable string per exact configuration: used to tell tests (and the UI) what was drawn. */
export function configKey(c: GlitchConfig): string {
  return [c.source, c.seed, c.phase, c.blocks, c.wave, c.shift, c.noise, c.scan, c.posterize].join(
    ":",
  );
}

/** The text alternative for the canvas: what is actually on screen. */
export function describeGlitch(c: GlitchConfig): string {
  const active = EFFECT_KEYS.filter((k) => c[k] > 0).map(
    (k) => `${EFFECT_INFO[k].label.toLowerCase()} ${c[k]}`,
  );
  if (c.posterize >= 2) active.push(`${c.posterize} colour levels`);
  const fx = active.length ? active.join(", ") : "no effects, the unmodified image";
  return `${SOURCE_LABELS[c.source]} test image, frame ${c.phase}, with ${fx}.`;
}

/** File name for a PNG export; pure so it can be tested. */
export function exportFileName(c: GlitchConfig): string {
  return `glitch-lab-${c.source}-seed${c.seed}-frame${c.phase}.png`;
}
