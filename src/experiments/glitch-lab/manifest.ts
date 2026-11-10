import { defineExperiment } from "@/engine/public";
import { defaultGlitchConfig, glitchConfigSchema, type GlitchConfig } from "./config";

const off = { blocks: 0, wave: 0, shift: 0, noise: 0, scan: 0, posterize: 0 } as const;

export const glitchLab = defineExperiment<GlitchConfig>({
  meta: {
    id: "glitch-lab",
    slug: "glitch-lab",
    title: "Glitch Lab",
    summary:
      "Run a generated test image through real glitch effects on your GPU, dial each one in, step through frames and download the result as a PNG.",
    category: "Graphics",
    tags: ["WebGL", "shaders", "image processing", "glitch art"],
    version: 1,
  },
  configSchema: glitchConfigSchema,
  defaultConfig: defaultGlitchConfig,
  examples: [
    {
      title: "Colour bars, red and blue split",
      note: "Red is read 12 pixels to the left and blue 12 pixels to the right of each pixel, green stays put, so every edge between bars grows a red and a blue fringe.",
      config: { ...defaultGlitchConfig, ...off, source: "bars", seed: 1, shift: 50 },
    },
    {
      title: "Torn rows",
      note: "The grid is cut into 32 bands of 16 rows. Some bands, not all, slide sideways by up to 44 pixels; each band moves as one piece. Which bands depends on the seed and the frame.",
      config: { ...defaultGlitchConfig, ...off, source: "grid", seed: 7, blocks: 70 },
    },
    {
      title: "Four-level scanlines",
      note: "Each colour channel keeps only 4 values (0, 85, 170 and 255), and every second row is then darkened by 30%.",
      config: { ...defaultGlitchConfig, ...off, source: "rings", seed: 3, posterize: 4, scan: 50 },
    },
  ],
});
