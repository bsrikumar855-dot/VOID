import type { Op } from "../core/sorts";

export interface LaneColors {
  bar: string;
  compare: string;
  write: string;
  done: string;
}

export interface LaneDrawInput {
  width: number;
  height: number;
  dpr: number;
  array: readonly number[];
  maxValue: number;
  lastOp: Op | null;
  done: boolean;
  colors: LaneColors;
}

export const TOP_MARGIN = 14;

/**
 * Draws one lane. State is encoded without relying on colour alone (WCAG 1.4.1):
 *   comparing  = accent bars + a bracket above them,
 *   swap/write = bright bars + a dot above them,
 *   finished   = secondary-accent bars + a solid baseline rule.
 */
export function drawLane(ctx: CanvasRenderingContext2D, input: LaneDrawInput): void {
  const { width, height, dpr, array, maxValue, lastOp, done, colors } = input;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const n = array.length;
  if (n === 0) return;
  const slot = width / n;
  const gap = slot > 5 ? 1 : 0;
  const barW = Math.max(1, slot - gap);
  const plotH = height - TOP_MARGIN;

  const highlight = new Map<number, "compare" | "write">();
  if (lastOp && !done) {
    if (lastOp.t === "cmp") {
      highlight.set(lastOp.i, "compare");
      highlight.set(lastOp.j, "compare");
    } else if (lastOp.t === "swap") {
      highlight.set(lastOp.i, "write");
      highlight.set(lastOp.j, "write");
    } else {
      highlight.set(lastOp.i, "write");
    }
  }

  for (let i = 0; i < n; i++) {
    const h = Math.max(1, (array[i] / maxValue) * plotH);
    const kind = highlight.get(i);
    ctx.fillStyle = done
      ? colors.done
      : kind === "compare"
        ? colors.compare
        : kind === "write"
          ? colors.write
          : colors.bar;
    ctx.fillRect(i * slot, height - h, barW, h);
  }

  if (done) {
    ctx.fillStyle = colors.done;
    ctx.fillRect(0, height - 2, width, 2);
    return;
  }

  if (lastOp?.t === "cmp") {
    const x1 = lastOp.i * slot + barW / 2;
    const x2 = lastOp.j * slot + barW / 2;
    const [a, b] = x1 <= x2 ? [x1, x2] : [x2, x1];
    ctx.strokeStyle = colors.compare;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(a, 9);
    ctx.lineTo(a, 3);
    ctx.lineTo(b, 3);
    ctx.lineTo(b, 9);
    ctx.stroke();
  } else if (lastOp && (lastOp.t === "swap" || lastOp.t === "set")) {
    ctx.fillStyle = colors.write;
    const idx = lastOp.t === "swap" ? [lastOp.i, lastOp.j] : [lastOp.i];
    for (const i of idx) {
      ctx.beginPath();
      ctx.arc(i * slot + barW / 2, 5, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
