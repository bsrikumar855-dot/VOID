"use client";

import { useEffect, useRef, useState } from "react";
import type { Op } from "../core/sorts";
import { TOP_MARGIN, drawLane, type LaneColors } from "./draw";

function readColors(): LaneColors {
  const cs = getComputedStyle(document.documentElement);
  const get = (name: string) => cs.getPropertyValue(name).trim();
  return {
    bar: get("--text-muted"),
    compare: get("--accent"),
    write: get("--text"),
    done: get("--accent-2"),
  };
}

interface Props {
  array: readonly number[];
  maxValue: number;
  lastOp: Op | null;
  done: boolean;
  label: string;
  className?: string;
  /** Pointer painting: called with the bar index and the value under the pointer. */
  onPaint?: (index: number, value: number) => void;
  onPaintEnd?: () => void;
}

export function LaneCanvas({
  array,
  maxValue,
  lastOp,
  done,
  label,
  className,
  onPaint,
  onPaintEnd,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0, dpr: 1 });
  // Client-only component (mounted with createRoot), so reading the DOM here is safe.
  const [colors, setColors] = useState<LaneColors | null>(() =>
    typeof document === "undefined" ? null : readColors(),
  );
  const painting = useRef(false);

  // Track the rendered size.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setSize({
        w: Math.round(r.width),
        h: Math.round(r.height),
        dpr: window.devicePixelRatio || 1,
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Canvas cannot use CSS variables, so read tokens and re-read when the theme changes.
  useEffect(() => {
    const mo = new MutationObserver(() => setColors(readColors()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el || !colors || size.w === 0) return;
    el.width = Math.round(size.w * size.dpr);
    el.height = Math.round(size.h * size.dpr);
    const ctx = el.getContext("2d");
    if (!ctx) return;
    drawLane(ctx, {
      width: size.w,
      height: size.h,
      dpr: size.dpr,
      array,
      maxValue,
      lastOp,
      done,
      colors,
    });
  }, [array, maxValue, lastOp, done, colors, size]);

  const paintFrom = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!onPaint) return;
    const r = e.currentTarget.getBoundingClientRect();
    const n = array.length;
    const index = Math.min(n - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * n)));
    // Bars are drawn inside the plot area (below TOP_MARGIN), so map the pointer into it.
    const plotH = Math.max(1, r.height - TOP_MARGIN);
    const frac = Math.min(1, Math.max(0, (r.height - (e.clientY - r.top)) / plotH));
    const value = Math.max(1, Math.round(frac * maxValue));
    onPaint(index, value);
  };

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={label}
      className={className}
      style={{
        touchAction: onPaint ? "none" : undefined,
        cursor: onPaint ? "crosshair" : undefined,
      }}
      onPointerDown={(e) => {
        if (!onPaint) return;
        painting.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        paintFrom(e);
      }}
      onPointerMove={(e) => painting.current && paintFrom(e)}
      onPointerUp={() => {
        if (painting.current) {
          painting.current = false;
          onPaintEnd?.();
        }
      }}
      onPointerCancel={() => {
        if (painting.current) onPaintEnd?.();
        painting.current = false;
      }}
    />
  );
}
