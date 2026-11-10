import { mulberry32 } from "@/engine/public";
import { IMAGE_SIZE as N, type SourceId } from "../limits";

/**
 * Procedurally generated test images, RGBA, row 0 at the top. Nothing is uploaded: the source
 * is a pure function of (kind, seed), so a share link needs no image data. Only integer
 * arithmetic and Math.floor/Math.sqrt (exact IEEE operations) are used, so the same bytes come
 * out in Node and in every browser (tests/unit/glitch-core.test.ts pins them by digest).
 *
 * This runs on the main thread when the experiment opens, so it is written to be cheap: rows
 * that repeat are built once and copied, and nothing is allocated per pixel.
 */
export function makeSource(kind: SourceId, seed: number): Uint8ClampedArray {
  const px = new Uint8ClampedArray(N * N * 4);
  const rand = mulberry32(seed + 1);
  switch (kind) {
    case "bars":
      bars(px, rand);
      break;
    case "rings":
      rings(px, rand, seed);
      break;
    case "grid":
      grid(px, rand);
      break;
    case "gradient":
      gradient(px, seed);
      break;
  }
  return px;
}

const ROW = N * 4;

/** Copy a prebuilt row into rows y0 .. y1-1. */
function fillRows(px: Uint8ClampedArray, row: Uint8ClampedArray, y0: number, y1: number) {
  for (let y = y0; y < y1; y++) px.set(row, y * ROW);
}

const BARS: ReadonlyArray<readonly [number, number, number]> = [
  [192, 192, 192],
  [192, 192, 0],
  [0, 192, 192],
  [0, 192, 0],
  [192, 0, 192],
  [192, 0, 0],
  [0, 0, 192],
  [16, 16, 16],
];

/** Colour bars, hard black/white stripes, a luminance ramp and a seed-placed white square. */
function bars(px: Uint8ClampedArray, rand: () => number) {
  const barsEnd = Math.floor((N * 68) / 100);
  const stripesEnd = Math.floor((N * 78) / 100);
  const sq = 48;
  const sqX = Math.floor(rand() * (N - sq));
  const sqY = stripesEnd + Math.floor(rand() * (N - stripesEnd - sq));

  const barRow = new Uint8ClampedArray(ROW);
  const stripeRow = new Uint8ClampedArray(ROW);
  const rampRow = new Uint8ClampedArray(ROW);
  for (let x = 0; x < N; x++) {
    const c = BARS[Math.floor((x * 8) / N)];
    const s = Math.floor(x / 8) % 2 === 0 ? 0 : 255;
    const r = Math.floor((x * 255) / (N - 1));
    barRow.set([c[0], c[1], c[2], 255], x * 4);
    stripeRow.set([s, s, s, 255], x * 4);
    rampRow.set([r, r, r, 255], x * 4);
  }
  fillRows(px, barRow, 0, barsEnd);
  fillRows(px, stripeRow, barsEnd, stripesEnd);
  fillRows(px, rampRow, stripesEnd, N);
  const white = new Uint8ClampedArray(sq * 4).fill(255);
  for (let y = sqY; y < sqY + sq; y++) px.set(white, y * ROW + sqX * 4);
}

/** Integer HSV to RGB: h in 0..359, s and v in 0..255. */
function hsv(h: number, s: number, v: number): [number, number, number] {
  const region = Math.floor(h / 60);
  const rem = ((h % 60) * 255) / 60;
  const p = Math.floor((v * (255 - s)) / 255);
  const q = Math.floor((v * (255 - Math.floor((s * rem) / 255))) / 255);
  const t = Math.floor((v * (255 - Math.floor((s * (255 - rem)) / 255))) / 255);
  switch (region) {
    case 0:
      return [v, t, p];
    case 1:
      return [q, v, p];
    case 2:
      return [p, v, t];
    case 3:
      return [p, q, v];
    case 4:
      return [t, p, v];
    default:
      return [v, p, q];
  }
}

/** Concentric rings, one hue per ring, centre offset by the seed. */
function rings(px: Uint8ClampedArray, rand: () => number, seed: number) {
  const cx = N / 2 + Math.floor(rand() * 80) - 40;
  const cy = N / 2 + Math.floor(rand() * 80) - 40;
  // The farthest corner is under 1.5 N away, so under 48 rings of 16 pixels: build the colour
  // of each ring once instead of once per pixel.
  const ringCount = Math.floor((N * 1.5) / 16) + 2;
  const table = Array.from({ length: ringCount }, (_, d) =>
    hsv((d * 47 + seed * 13) % 360, 220, d % 2 === 0 ? 255 : 190),
  );
  for (let y = 0; y < N; y++) {
    const dy2 = (y - cy) * (y - cy);
    for (let x = 0; x < N; x++) {
      const d = Math.floor(Math.sqrt((x - cx) * (x - cx) + dy2) / 16);
      const c = table[d];
      const i = y * ROW + x * 4;
      px[i] = c[0];
      px[i + 1] = c[1];
      px[i + 2] = c[2];
      px[i + 3] = 255;
    }
  }
}

const CELL = 64;
const LINE = 3;
const PALETTE: ReadonlyArray<readonly [number, number, number]> = [
  [235, 64, 52],
  [244, 180, 0],
  [15, 157, 88],
  [66, 133, 244],
  [171, 71, 188],
  [236, 236, 236],
];

/** An 8 x 8 grid of seed-coloured cells with dark lines. */
function grid(px: Uint8ClampedArray, rand: () => number) {
  const cells = N / CELL;
  const colour: number[] = [];
  for (let i = 0; i < cells * cells; i++) colour.push(Math.floor(rand() * PALETTE.length));
  const lineRow = new Uint8ClampedArray(ROW);
  for (let x = 0; x < N; x++) lineRow.set([20, 20, 24, 255], x * 4);
  for (let cy = 0; cy < cells; cy++) {
    const row = new Uint8ClampedArray(ROW);
    for (let x = 0; x < N; x++) {
      const c = x % CELL < LINE ? [20, 20, 24] : PALETTE[colour[cy * cells + Math.floor(x / CELL)]];
      row.set([c[0], c[1], c[2], 255], x * 4);
    }
    fillRows(px, lineRow, cy * CELL, cy * CELL + LINE);
    fillRows(px, row, cy * CELL + LINE, (cy + 1) * CELL);
  }
}

const PERMS = [
  [0, 1, 2],
  [0, 2, 1],
  [1, 0, 2],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
] as const;

/** A diagonal gradient whose channel assignment depends on the seed. */
function gradient(px: Uint8ClampedArray, seed: number) {
  const [p0, p1, p2] = PERMS[seed % PERMS.length];
  const span = 2 * (N - 1);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      // a rises along the diagonal, b falls, c grows away from it; the seed picks which of
      // them lands in red, green and blue (output channel k shows value number perm[k]).
      const a = Math.floor((255 * (x + y)) / span);
      const b = Math.floor((255 * (span - (x + y))) / span);
      const c = Math.floor((255 * Math.abs(x - y)) / (N - 1));
      const i = y * ROW + x * 4;
      px[i] = p0 === 0 ? a : p0 === 1 ? b : c;
      px[i + 1] = p1 === 0 ? a : p1 === 1 ? b : c;
      px[i + 2] = p2 === 0 ? a : p2 === 1 ? b : c;
      px[i + 3] = 255;
    }
  }
}
