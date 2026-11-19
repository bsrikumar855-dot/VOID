// Captures one real image of each experiment at its default settings, for the homepage.
//
//   npm run build && npm run start      (or npm run dev), then in another terminal:
//   npm run previews
//
// These are screenshots of the running experiments, not mock-ups: Glitch Lab's own canvas pixels
// and the Neural Network's own diagram. They are committed (public/previews) so the homepage
// needs no build step for them; re-run this script when an experiment's look changes.
// An experiment without an entry here is listed on the homepage without an image.
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const BASE = process.env.PREVIEW_URL ?? "http://127.0.0.1:3000";
const OUT = "public/previews";
const CHANNEL = process.env.PW_CHANNEL ?? "msedge";

/** slug -> how to capture it. Each returns { buffer, width, height, ext }. */
const CAPTURES = {
  "glitch-lab": async (page) => {
    await page.goto(`${BASE}/experiments/glitch-lab`);
    const canvas = page.locator("canvas[data-drawn]");
    await canvas.waitFor();
    await page.locator('canvas[data-renderer="webgl2"], canvas[data-renderer="cpu"]').waitFor();
    // The canvas's own pixels, exactly as drawn (512 x 512), not a screenshot of its CSS box.
    const dataUrl = await canvas.evaluate((c) => c.toDataURL("image/jpeg", 0.86));
    return {
      buffer: Buffer.from(dataUrl.split(",")[1], "base64"),
      width: 512,
      height: 512,
      ext: "jpg",
      alt: "Glitch Lab at its default settings: colour bars with torn rows, a red and blue fringe on every edge, light noise and scanlines.",
    };
  },
  "neural-network": async (page) => {
    await page.goto(`${BASE}/experiments/neural-network`);
    const svg = page.locator('svg[role="group"]');
    await svg.waitFor();
    await page.getByText("All neurons computed.").waitFor();
    const box = await svg.boundingBox();
    return {
      buffer: await svg.screenshot({ type: "png" }),
      width: Math.round(box.width),
      height: Math.round(box.height),
      ext: "png",
      alt: "Neural Network Playground at its default settings: two inputs, two hidden neurons and one output, computing XOR, with the value shown on every neuron.",
    };
  },
};

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: CHANNEL });
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 1,
  colorScheme: "dark",
  reducedMotion: "no-preference",
});
await context.addInitScript(() => {
  try {
    localStorage.setItem("void-theme", "dark");
  } catch {}
});

const index = {};
for (const [slug, capture] of Object.entries(CAPTURES)) {
  const page = await context.newPage();
  const { buffer, width, height, ext, alt } = await capture(page);
  const file = `${slug}.${ext}`;
  writeFileSync(`${OUT}/${file}`, buffer);
  index[slug] = { file, width, height, alt };
  console.log(`${slug}: ${file} ${width}x${height} ${(buffer.length / 1024).toFixed(1)} KB`);
  await page.close();
}
writeFileSync(`${OUT}/index.json`, JSON.stringify(index, null, 2) + "\n");
await browser.close();
