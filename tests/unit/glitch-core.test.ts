import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { glitchLab } from "@/experiments/glitch-lab/manifest";
import {
  PHASE_MAX,
  SEED_MAX,
  SOURCES,
  defaultGlitchConfig,
  glitchConfigSchema,
  type GlitchConfig,
} from "@/experiments/glitch-lab/config";
import { hash4, pcg } from "@/experiments/glitch-lab/core/hash";
import {
  blockOffset,
  renderReference,
  toParams,
  waveOffset,
} from "@/experiments/glitch-lab/core/pipeline";
import { makeSource } from "@/experiments/glitch-lab/core/source";
import { configKey, describeGlitch, exportFileName } from "@/experiments/glitch-lab/core/text";
import { BLOCK_H, IMAGE_SIZE as N } from "@/experiments/glitch-lab/limits";

const off = { blocks: 0, wave: 0, shift: 0, noise: 0, scan: 0, posterize: 0 } as const;
const cfg = (over: Partial<GlitchConfig> = {}): GlitchConfig => ({
  ...defaultGlitchConfig,
  ...off,
  ...over,
});
const px = (img: ArrayLike<number>, x: number, y: number) => {
  const i = (y * N + x) * 4;
  return [img[i], img[i + 1], img[i + 2], img[i + 3]];
};
const clampX = (x: number) => Math.min(N - 1, Math.max(0, x));

describe("integer hash (reference values from an independent Python implementation)", () => {
  it("pcg", () => {
    expect([0, 1, 2, 123456789, 4294967295].map(pcg)).toEqual([
      129708002, 2831084092, 2055130248, 4272394698, 3861530882,
    ]);
  });
  it("hash4", () => {
    expect(hash4(1, 2, 3, 4)).toBe(2917755029);
    expect(hash4(0, 0, 0, 0)).toBe(2368882721);
    expect(hash4(31, 1, 0, 1)).toBe(3502859326);
    expect(hash4(511, 511, 9999, 9999 + 7)).toBe(1199219417);
  });
});

describe("test images", () => {
  it.each(SOURCES)("%s: right size, opaque, deterministic, and the seed matters", (kind) => {
    const a = makeSource(kind, 5);
    expect(a).toHaveLength(N * N * 4);
    for (let i = 3; i < a.length; i += 4) if (a[i] !== 255) throw new Error(`alpha at ${i}`);
    expect(makeSource(kind, 5)).toEqual(a);
    expect(makeSource(kind, 6)).not.toEqual(a);
    const colours = new Set<number>();
    for (let i = 0; i < a.length; i += 4 * 97)
      colours.add((a[i] << 16) | (a[i + 1] << 8) | a[i + 2]);
    expect(colours.size).toBeGreaterThan(6); // not a flat image
  });

  it("colour bars have the documented layout", () => {
    const a = makeSource("bars", 1);
    expect(px(a, 0, 0)).toEqual([192, 192, 192, 255]); // first bar
    expect(px(a, N - 1, 0)).toEqual([16, 16, 16, 255]); // last bar
    expect(px(a, 1 * 64 + 10, 10)).toEqual([192, 192, 0, 255]); // second bar spans x 64..127
    // rows 348..398 are hard black/white stripes 8 pixels wide
    expect(px(a, 0, 360).slice(0, 3)).toEqual([0, 0, 0]);
    expect(px(a, 8, 360).slice(0, 3)).toEqual([255, 255, 255]);
  });
});

describe("test images are pinned by digest", () => {
  // Regression pins taken from the first (straightforward, per-pixel) implementation; the
  // optimised generator must reproduce every byte. They pin behaviour, they are not an
  // independent oracle (the layout test above and the Python hash values are).
  const PINNED: Record<string, string> = {
    "bars:0": "c9b4be7858634638",
    "bars:1": "0dec94ad3e6eb1bf",
    "bars:3": "b8c3083bb1022205",
    "bars:7": "910c149de0f65a71",
    "bars:9999": "b3db179aaff31131",
    "rings:0": "8b9093aeb22741d3",
    "rings:1": "3bc94a84b5366b11",
    "rings:3": "e00cea56c96f6048",
    "rings:7": "d86b8d48f3620c6e",
    "rings:9999": "23b374b3d342b123",
    "grid:0": "a5fbcd521bfb4ede",
    "grid:1": "36452d3e96a6b3e4",
    "grid:3": "9d1d46ce977cca54",
    "grid:7": "7016de5b017eb54e",
    "grid:9999": "8f5299b8e6a57ccf",
    "gradient:0": "c298a917df30ae3b",
    "gradient:1": "2ddd02d2a9e7e7b7",
    "gradient:3": "82e91b0806f3e2e8",
    "gradient:7": "2ddd02d2a9e7e7b7", // 7 % 6 === 1: the seed only picks the channel order
    "gradient:9999": "82e91b0806f3e2e8", // 9999 % 6 === 3
  };
  it.each(Object.entries(PINNED))("%s", (key, digest) => {
    const [kind, seed] = key.split(":");
    const img = makeSource(kind as (typeof SOURCES)[number], Number(seed));
    expect(createHash("sha256").update(img).digest("hex").slice(0, 16)).toBe(digest);
  });
});

describe("pipeline parameters", () => {
  it("derive from the config with integer arithmetic", () => {
    expect(toParams(cfg({ shift: 50 })).shiftPx).toBe(12);
    expect(toParams(cfg({ shift: 100 })).shiftPx).toBe(24);
    expect(toParams(cfg({ blocks: 70 })).blockAmp).toBe(44);
    expect(toParams(cfg({ scan: 50 })).scanFactor).toBe(70);
    expect(toParams(cfg({ scan: 100 })).scanFactor).toBe(40);
    expect(toParams(cfg({ phase: 5 })).blockFrame).toBe(2);
  });
});

describe("each effect does exactly what its label says", () => {
  const bars = makeSource("bars", 1);

  it("with every effect off the output is the source, pixel for pixel", () => {
    for (const kind of SOURCES) {
      const src = makeSource(kind, 3);
      expect(renderReference(src, cfg({ source: kind, seed: 3 }))).toEqual(src);
    }
  });

  it("colour split: red is read 12 px to the left, blue 12 px to the right, green stays", () => {
    const out = renderReference(bars, cfg({ shift: 50 }));
    for (const y of [0, 100, 360, 450]) {
      for (const x of [0, 5, 63, 64, 100, 300, 500, N - 1]) {
        expect(out[(y * N + x) * 4]).toBe(bars[(y * N + clampX(x - 12)) * 4]);
        expect(out[(y * N + x) * 4 + 1]).toBe(bars[(y * N + x) * 4 + 1]);
        expect(out[(y * N + x) * 4 + 2]).toBe(bars[(y * N + clampX(x + 12)) * 4 + 2]);
      }
    }
  });

  it("posterize: 4 levels keep only 0, 85, 170 and 255, with the right thresholds", () => {
    // A synthetic source whose value is x mod 256 in every channel.
    const ramp = new Uint8ClampedArray(N * N * 4);
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) ramp.set([x % 256, x % 256, x % 256, 255], (y * N + x) * 4);
    const out = renderReference(ramp, cfg({ posterize: 4 }));
    const expected = (v: number) => (v <= 42 ? 0 : v <= 127 ? 85 : v <= 212 ? 170 : 255);
    for (let v = 0; v < 256; v++) expect(out[v * 4], `v=${v}`).toBe(expected(v));
    // 2 levels is black or white; 16 levels has 16 distinct values
    const two = renderReference(ramp, cfg({ posterize: 2 }));
    expect(new Set(Array.from({ length: 256 }, (_, v) => two[v * 4]))).toEqual(new Set([0, 255]));
    const sixteen = renderReference(ramp, cfg({ posterize: 16 }));
    expect(new Set(Array.from({ length: 256 }, (_, v) => sixteen[v * 4])).size).toBe(16);
  });

  it("scanlines: every second row keeps floor(v * factor / 100), even rows are untouched", () => {
    const out = renderReference(bars, cfg({ scan: 50 })); // factor 70
    for (const x of [0, 70, 300, N - 1]) {
      expect(px(out, x, 10)).toEqual(px(bars, x, 10)); // even row
      const s = px(bars, x, 11);
      expect(px(out, x, 11)).toEqual([
        Math.floor((s[0] * 70) / 100),
        Math.floor((s[1] * 70) / 100),
        Math.floor((s[2] * 70) / 100),
        255,
      ]);
    }
  });

  it("noise: same amount on all channels, bounded by the strength, deterministic, zero when off", () => {
    const flat = new Uint8ClampedArray(N * N * 4).fill(128);
    for (let i = 3; i < flat.length; i += 4) flat[i] = 255;
    const out = renderReference(flat, cfg({ noise: 50, seed: 9, phase: 4 }));
    let min = 255;
    let max = 0;
    for (let i = 0; i < N * N * 4; i += 4) {
      expect(out[i + 1]).toBe(out[i]);
      expect(out[i + 2]).toBe(out[i]);
      min = Math.min(min, out[i]);
      max = Math.max(max, out[i]);
    }
    // n is in [-128, 127]; add = trunc(n * 50 / 100) is in [-64, 63]
    expect(min).toBeGreaterThanOrEqual(128 - 64);
    expect(max).toBeLessThanOrEqual(128 + 63);
    expect(max - min).toBeGreaterThan(100); // it really does vary pixel to pixel
    expect(renderReference(flat, cfg({ noise: 50, seed: 9, phase: 4 }))).toEqual(out);
    expect(renderReference(flat, cfg({ noise: 50, seed: 9, phase: 5 }))).not.toEqual(out);
    expect(renderReference(flat, cfg({ noise: 0, seed: 9, phase: 4 }))).toEqual(flat);
  });

  it("wave: a triangle wave of period 64 rows with the documented extremes", () => {
    const p = toParams(cfg({ wave: 100 }));
    expect(waveOffset(p, 0)).toBe(24); // tri = 32
    expect(waveOffset(p, 16)).toBe(0); // tri = 16
    expect(waveOffset(p, 32)).toBe(-24); // tri = 0
    for (let y = 0; y < 200; y++) {
      expect(waveOffset(p, y)).toBe(waveOffset(p, y + 64));
      expect(Math.abs(waveOffset(p, y))).toBeLessThanOrEqual(24);
    }
    expect(waveOffset(toParams(cfg({ wave: 0 })), 5)).toBe(0);
    // and it moves with the frame number
    expect(waveOffset(toParams(cfg({ wave: 100, phase: 8 })), 0)).toBe(waveOffset(p, 16));
  });

  it("torn rows: each 16-row band moves as one piece, by a bounded amount", () => {
    const c = cfg({ source: "grid", seed: 7, blocks: 70 });
    const src = makeSource("grid", 7);
    const out = renderReference(src, c);
    const p = toParams(c);
    let moved = 0;
    for (let band = 0; band < N / BLOCK_H; band++) {
      const off = blockOffset(p, band);
      expect(Math.abs(off)).toBeLessThanOrEqual(p.blockAmp);
      if (off !== 0) moved++;
      for (const y of [band * BLOCK_H, band * BLOCK_H + 7, band * BLOCK_H + BLOCK_H - 1]) {
        if (y & 1) continue;
        for (const x of [0, 100, 255, N - 1]) {
          expect(px(out, x, y)).toEqual(px(src, clampX(x + off), y));
        }
      }
    }
    expect(moved).toBeGreaterThan(0);
    expect(moved).toBeLessThan(N / BLOCK_H);
  });

  it("torn rows re-roll every second frame and at most half the bands are selected", () => {
    let totalActive = 0;
    let samples = 0;
    let rerolled = false;
    for (let seed = 0; seed < 40; seed++) {
      const f0 = toParams(cfg({ blocks: 100, seed, phase: 0 }));
      const f1 = toParams(cfg({ blocks: 100, seed, phase: 1 }));
      const f2 = toParams(cfg({ blocks: 100, seed, phase: 2 }));
      for (let band = 0; band < N / BLOCK_H; band++) {
        expect(blockOffset(f0, band)).toBe(blockOffset(f1, band));
        if (blockOffset(f0, band) !== blockOffset(f2, band)) rerolled = true;
        if (blockOffset(f0, band) !== 0) totalActive++;
        samples++;
      }
    }
    expect(rerolled).toBe(true);
    const share = totalActive / samples;
    expect(share).toBeGreaterThan(0.35);
    expect(share).toBeLessThan(0.55);
    expect(toParams(cfg({ blocks: 0 })).blocks).toBe(0);
    expect(blockOffset(toParams(cfg({ blocks: 0, seed: 3 })), 4)).toBe(0);
  });

  it("is deterministic and stays in range at the extremes of every parameter", () => {
    const wild = cfg({
      source: "rings",
      seed: SEED_MAX,
      phase: PHASE_MAX,
      blocks: 100,
      wave: 100,
      shift: 100,
      noise: 100,
      scan: 100,
      posterize: 16,
    });
    const src = makeSource("rings", SEED_MAX);
    const a = renderReference(src, wild);
    expect(renderReference(src, wild)).toEqual(a);
    for (let i = 3; i < a.length; i += 4) if (a[i] !== 255) throw new Error("alpha");
  });
});

describe("schema (shared links are untrusted)", () => {
  const ok = (c: unknown) => glitchConfigSchema.safeParse(c).success;
  it("accepts the default and rejects everything out of bounds", () => {
    expect(ok(defaultGlitchConfig)).toBe(true);
    expect(ok({ ...defaultGlitchConfig, source: "video" })).toBe(false);
    expect(ok({ ...defaultGlitchConfig, seed: SEED_MAX + 1 })).toBe(false);
    expect(ok({ ...defaultGlitchConfig, phase: -1 })).toBe(false);
    expect(ok({ ...defaultGlitchConfig, shift: 101 })).toBe(false);
    expect(ok({ ...defaultGlitchConfig, scan: 1.5 })).toBe(false);
    expect(ok({ ...defaultGlitchConfig, noise: "5" })).toBe(false);
    expect(ok({ ...defaultGlitchConfig, noise: Infinity })).toBe(false);
  });
  it("posterize is off (0) or 2 to 16 levels; 1 is meaningless", () => {
    for (const v of [0, 2, 16]) expect(ok({ ...defaultGlitchConfig, posterize: v })).toBe(true);
    for (const v of [1, 17, -1]) expect(ok({ ...defaultGlitchConfig, posterize: v })).toBe(false);
  });
  it("rejects unknown keys, including __proto__", () => {
    expect(ok({ ...defaultGlitchConfig, extra: 1 })).toBe(false);
    expect(
      ok(
        JSON.parse(
          `{"source":"bars","seed":1,"phase":0,"blocks":0,"wave":0,"shift":0,"noise":0,"scan":0,"posterize":0,"__proto__":{"x":1}}`,
        ),
      ),
    ).toBe(false);
  });
});

describe("text", () => {
  it("describes what is on screen, names effects that are on, and says so when none are", () => {
    expect(describeGlitch(cfg({ shift: 50, posterize: 4, phase: 3 }))).toBe(
      "Colour bars test image, frame 3, with colour split 50, 4 colour levels.",
    );
    expect(describeGlitch(cfg())).toContain("no effects, the unmodified image");
  });
  it("file names and keys are stable", () => {
    expect(exportFileName(cfg({ source: "rings", seed: 12, phase: 34 }))).toBe(
      "glitch-lab-rings-seed12-frame34.png",
    );
    expect(configKey(defaultGlitchConfig)).toBe("bars:1:0:20:15:30:10:25:0");
    expect(configKey(cfg({ phase: 1 }))).not.toBe(configKey(cfg({ phase: 2 })));
  });
});

describe("curated examples: every note is literally true", () => {
  const [split, torn, scan] = glitchLab.examples!;

  it("colour split: 12 px left for red, 12 px right for blue, green unchanged", () => {
    expect(split.note).toContain("12 pixels");
    const src = makeSource(split.config.source, split.config.seed);
    const out = renderReference(src, split.config);
    expect(toParams(split.config).shiftPx).toBe(12);
    for (const [x, y] of [
      [63, 10],
      [64, 10],
      [200, 100],
      [10, 300],
    ]) {
      expect(out[(y * N + x) * 4]).toBe(src[(y * N + clampX(x - 12)) * 4]);
      expect(out[(y * N + x) * 4 + 1]).toBe(src[(y * N + x) * 4 + 1]);
      expect(out[(y * N + x) * 4 + 2]).toBe(src[(y * N + clampX(x + 12)) * 4 + 2]);
    }
    // "every edge between bars grows a fringe": at each of the 7 bar edges the output differs
    const edges = [64, 128, 192, 256, 320, 384, 448];
    for (const e of edges) {
      const row = 10;
      const changed = [e - 12, e + 11].some(
        (x) => px(out, x, row).join() !== px(src, x, row).join(),
      );
      expect(changed, `edge at ${e}`).toBe(true);
    }
  });

  it("torn rows: 32 bands of 16 rows, some but not all move, by at most 44 px", () => {
    expect(torn.note).toContain("32 bands of 16 rows");
    expect(torn.note).toContain("44 pixels");
    expect(N / BLOCK_H).toBe(32);
    const p = toParams(torn.config);
    const offs = Array.from({ length: 32 }, (_, b) => blockOffset(p, b));
    expect(offs.some((o) => o !== 0)).toBe(true);
    expect(offs.some((o) => o === 0)).toBe(true);
    expect(Math.max(...offs.map(Math.abs))).toBeLessThanOrEqual(44);
  });

  it("four-level scanlines: even rows only hold 0/85/170/255, odd rows are exactly 30% darker", () => {
    expect(scan.note).toContain("0, 85, 170 and 255");
    expect(scan.note).toContain("30%");
    const out = renderReference(makeSource(scan.config.source, scan.config.seed), scan.config);
    const levels = new Set([0, 85, 170, 255]);
    const darker = (v: number) => Math.floor((v * 70) / 100);
    const darkLevels = new Set([...levels].map(darker));
    for (let y = 0; y < N; y += 37) {
      for (let x = 0; x < N; x += 41) {
        for (const c of [0, 1, 2]) {
          const v = out[(y * N + x) * 4 + c];
          expect((y & 1 ? darkLevels : levels).has(v), `(${x},${y},${c})=${v}`).toBe(true);
        }
      }
    }
    expect(toParams(scan.config).scanFactor).toBe(70);
  });
});
