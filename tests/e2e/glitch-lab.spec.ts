import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { expect, test, type Page } from "@playwright/test";
import { decodeShare, encodeShare } from "@/engine/share/codec";
import { defaultGlitchConfig, type GlitchConfig } from "@/experiments/glitch-lab/config";
import { renderReference } from "@/experiments/glitch-lab/core/pipeline";
import { makeSource } from "@/experiments/glitch-lab/core/source";
import { configKey, exportFileName } from "@/experiments/glitch-lab/core/text";
import { IMAGE_SIZE } from "@/experiments/glitch-lab/limits";
import { glitchLab } from "@/experiments/glitch-lab/manifest";

/**
 * What is specific to Glitch Lab (the generic contract in experiments-contract.spec.ts covers
 * load, share round-trip, hostile links, axe and lifecycle). The central claim tested here: the
 * GPU shader, the in-browser CPU fallback and the pure reference in core/pipeline.ts draw the
 * SAME BYTES, and Download PNG saves exactly those bytes.
 */
const path = "/experiments/glitch-lab";
const canvas = (page: Page) => page.getByRole("img", { name: /test image, frame/ });
const status = (page: Page) => page.locator('[role="status"][aria-live="polite"]');

const sha = (bytes: ArrayLike<number>) =>
  createHash("sha256").update(Uint8Array.from(bytes)).digest("hex");
const referenceDigest = (c: GlitchConfig) => sha(renderReference(makeSource(c.source, c.seed), c));

async function open(page: Page, c: GlitchConfig) {
  await page.goto(`${path}#${encodeShare(glitchLab, c)}`);
  await expect(canvas(page)).toHaveAttribute("data-drawn", configKey(c));
}

/** SHA-256 of the RGBA bytes currently on the canvas, computed in the browser. */
async function pageDigest(page: Page): Promise<string> {
  return page.evaluate(async () => {
    const c = document.querySelector<HTMLCanvasElement>('canvas[role="img"]')!;
    const copy = document.createElement("canvas");
    copy.width = c.width;
    copy.height = c.height;
    const ctx = copy.getContext("2d")!;
    ctx.drawImage(c, 0, 0);
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    const hash = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
  });
}

/** Minimal PNG decoder (8-bit RGB/RGBA, non-interlaced), enough to check an export byte for byte. */
function decodePng(buf: Buffer) {
  expect(buf.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  let pos = 8;
  let w = 0;
  let h = 0;
  let depth = 0;
  let colourType = 0;
  const idat: Buffer[] = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
      depth = data[8];
      colourType = data[9];
      expect(data[12], "interlaced PNG not supported by this test").toBe(0);
    } else if (type === "IDAT") idat.push(data);
    pos += 12 + len;
  }
  expect(depth).toBe(8);
  const bpp = colourType === 6 ? 4 : colourType === 2 ? 3 : 0;
  expect(bpp, `unsupported PNG colour type ${colourType}`).toBeGreaterThan(0);
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * bpp;
  const rgba = new Uint8Array(w * h * 4);
  let prev = new Uint8Array(stride);
  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)];
    const cur = Uint8Array.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0;
      const b = prev[i];
      const c = i >= bpp ? prev[i - bpp] : 0;
      let add = 0;
      if (filter === 1) add = a;
      else if (filter === 2) add = b;
      else if (filter === 3) add = (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        add = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[i] = (cur[i] + add) & 255;
    }
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      rgba[o] = cur[x * bpp];
      rgba[o + 1] = cur[x * bpp + 1];
      rgba[o + 2] = cur[x * bpp + 2];
      rgba[o + 3] = bpp === 4 ? cur[x * bpp + 3] : 255;
    }
    prev = cur;
  }
  return { w, h, rgba };
}

const withOthers = (over: Partial<GlitchConfig>): GlitchConfig => ({
  ...defaultGlitchConfig,
  ...over,
});

const CASES: Array<[string, GlitchConfig]> = [
  ["the default settings", defaultGlitchConfig],
  ...(glitchLab.examples ?? []).map((e): [string, GlitchConfig] => [
    `example "${e.title}"`,
    e.config,
  ]),
  [
    "every effect at its extreme on a grid, frame 9999",
    withOthers({
      source: "grid",
      seed: 9999,
      phase: 9999,
      blocks: 100,
      wave: 100,
      shift: 100,
      noise: 100,
      scan: 100,
      posterize: 16,
    }),
  ],
  [
    "noise and waves on the gradient at frame 123",
    withOthers({ source: "gradient", seed: 42, phase: 123, noise: 60, wave: 80, blocks: 0 }),
  ],
];

test.describe("glitch lab", () => {
  test("draws on the GPU at the documented size", async ({ page }) => {
    await open(page, defaultGlitchConfig);
    await expect(canvas(page)).toHaveAttribute("data-renderer", "webgl2");
    expect(await canvas(page).evaluate((c: HTMLCanvasElement) => [c.width, c.height])).toEqual([
      IMAGE_SIZE,
      IMAGE_SIZE,
    ]);
    await expect(page.getByText(/^Frame 0\. Drawn on the GPU \(WebGL 2\)\.$/)).toBeVisible();
  });

  for (const [name, c] of CASES) {
    test(`the GPU draws exactly the reference pixels: ${name}`, async ({ page }) => {
      await open(page, c);
      await expect(canvas(page)).toHaveAttribute("data-renderer", "webgl2");
      expect(await pageDigest(page)).toBe(referenceDigest(c));
    });
  }

  test("without WebGL 2 the CPU fallback draws the same pixels, and says so", async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        type: string,
        ...rest: unknown[]
      ) {
        if (type === "webgl2" || type === "webgl") return null;
        return (original as (...a: unknown[]) => unknown).call(this, type, ...rest);
      } as typeof original;
    });
    const c = withOthers({ source: "rings", seed: 5, phase: 11, noise: 30, posterize: 6 });
    await open(page, c);
    await expect(canvas(page)).toHaveAttribute("data-renderer", "cpu");
    await expect(page.getByText(/CPU, because WebGL 2 is not available here/)).toBeVisible();
    expect(await pageDigest(page)).toBe(referenceDigest(c));
  });

  test("Download PNG saves exactly the pixels on screen", async ({ page }) => {
    const c = withOthers({ source: "bars", seed: 4, phase: 6, shift: 70, noise: 20, scan: 30 });
    await open(page, c);
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Download PNG" }).click(),
    ]);
    expect(download.suggestedFilename()).toBe(exportFileName(c));
    const file = await download.path();
    const png = decodePng(readFileSync(file));
    expect([png.w, png.h]).toEqual([IMAGE_SIZE, IMAGE_SIZE]);
    expect(sha(png.rgba)).toBe(referenceDigest(c));
    await expect(status(page)).toContainText(`Saved ${exportFileName(c)}`);
  });

  test("moving an effect redraws and updates the share link", async ({ page }) => {
    await open(page, defaultGlitchConfig);
    const before = await pageDigest(page);
    await page.locator('input[name="shift"]').fill("90");
    const expected = withOthers({ shift: 90 });
    await expect(canvas(page)).toHaveAttribute("data-drawn", configKey(expected));
    expect(await pageDigest(page)).not.toBe(before);
    expect(await pageDigest(page)).toBe(referenceDigest(expected));
    await expect
      .poll(() => decodeShare(new URL(page.url()).hash, glitchLab))
      .toEqual({ ok: true, config: expected });
  });

  test("changing the image type and seed redraws the right source", async ({ page }) => {
    await open(page, defaultGlitchConfig);
    await page.locator('select[name="source"]').selectOption("rings");
    await page.locator('input[name="seed"]').fill("77");
    const expected = withOthers({ source: "rings", seed: 77 });
    await expect(canvas(page)).toHaveAttribute("data-drawn", configKey(expected));
    expect(await pageDigest(page)).toBe(referenceDigest(expected));
  });

  test("Step frame and Back to frame 0 move the frame number and the link", async ({ page }) => {
    await open(page, defaultGlitchConfig);
    await page.getByRole("button", { name: "Step frame" }).click();
    await page.getByRole("button", { name: "Step frame" }).click();
    await expect(page.getByText(/^Frame 2\./)).toBeVisible();
    const two = withOthers({ phase: 2 });
    expect(await pageDigest(page)).toBe(referenceDigest(two));
    await expect
      .poll(() => decodeShare(new URL(page.url()).hash, glitchLab))
      .toEqual({ ok: true, config: two });
    await page.getByRole("button", { name: "Back to frame 0" }).click();
    await expect(page.getByText(/^Frame 0\./)).toBeVisible();
  });

  test("animation never starts by itself, Play advances frames, Pause fixes the frame in the link", async ({
    page,
  }) => {
    await open(page, defaultGlitchConfig);
    // A negative assertion needs time to pass: a second is twelve frames if it were running.
    await page.waitForTimeout(1000);
    await expect(canvas(page)).toHaveAttribute("data-drawn", configKey(defaultGlitchConfig));

    await page.getByRole("button", { name: "Play" }).click();
    await expect(page.getByRole("button", { name: "Pause" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect
      .poll(async () => Number((await canvas(page).getAttribute("data-drawn"))!.split(":")[2]))
      .toBeGreaterThan(3);
    await page.getByRole("button", { name: "Pause" }).click();
    const frame = Number((await canvas(page).getAttribute("data-drawn"))!.split(":")[2]);
    await expect
      .poll(async () => {
        const r = decodeShare(new URL(page.url()).hash, glitchLab);
        return r.ok ? (r.config as GlitchConfig).phase : -1;
      })
      .toBe(frame);
    // and it stays put once paused
    await page.waitForTimeout(400);
    expect(Number((await canvas(page).getAttribute("data-drawn"))!.split(":")[2])).toBe(frame);
    expect(await pageDigest(page)).toBe(referenceDigest(withOthers({ phase: frame })));
  });

  test("a reduced-motion preference is acknowledged and animation still waits for Play", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, defaultGlitchConfig);
    await expect(page.getByText(/your system asks for reduced motion/)).toBeVisible();
    await page.waitForTimeout(800);
    await expect(canvas(page)).toHaveAttribute("data-drawn", configKey(defaultGlitchConfig));
  });

  test("Randomize is deterministic from the seed and Default settings restores the default", async ({
    page,
  }) => {
    await open(page, withOthers({ seed: 10 }));
    await page.getByRole("button", { name: "Randomize effects" }).click();
    await expect(status(page)).toContainText("Effects randomized from seed 11");
    await expect
      .poll(async () => {
        const r = decodeShare(new URL(page.url()).hash, glitchLab);
        return r.ok ? (r.config as GlitchConfig).seed : -1;
      })
      .toBe(11);
    const first = await pageDigest(page);
    // Same starting point, same press, same result.
    await page.goto(`${path}#${encodeShare(glitchLab, withOthers({ seed: 10 }))}`);
    await expect(canvas(page)).toHaveAttribute("data-drawn", configKey(withOthers({ seed: 10 })));
    await page.getByRole("button", { name: "Randomize effects" }).click();
    await expect.poll(() => pageDigest(page)).toBe(first);

    await page.getByRole("button", { name: "Default settings" }).click();
    await expect(canvas(page)).toHaveAttribute("data-drawn", configKey(defaultGlitchConfig));
  });

  test("the posterize slider skips the meaningless one-level setting", async ({ page }) => {
    await open(page, defaultGlitchConfig);
    const slider = page.locator('input[name="posterize"]');
    await slider.fill("1");
    await expect(canvas(page)).toHaveAttribute(
      "data-drawn",
      configKey(withOthers({ posterize: 2 })),
    );
    await slider.fill("0");
    await expect(canvas(page)).toHaveAttribute("data-drawn", configKey(defaultGlitchConfig));
  });

  test("the canvas has a text alternative that matches what is drawn", async ({ page }) => {
    await open(page, withOthers({ shift: 50, blocks: 0, wave: 0, noise: 0, scan: 0, phase: 3 }));
    await expect(canvas(page)).toHaveAttribute(
      "aria-label",
      "Colour bars test image, frame 3, with colour split 50.",
    );
  });
});
