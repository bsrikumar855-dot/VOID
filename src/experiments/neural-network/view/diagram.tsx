"use client";

import type { NeuronStep, Net } from "../core/network";

export interface Selection {
  /** 0 = input layer. */
  layer: number;
  neuron: number;
}

interface Props {
  net: Net;
  /** acts[layer][neuron]; null = not computed yet (inputs are always known). */
  acts: (number | null)[][];
  current: NeuronStep | null;
  selected: Selection | null;
  onSelect(selection: Selection): void;
}

const W = 720;
const MARGIN_X = 56;
const SPACING = 66;
const RADIUS = 21;

const fmt = (x: number) => (Math.abs(x) < 0.0005 ? 0 : x).toFixed(3);

function layerName(layer: number, layerCount: number): string {
  if (layer === 0) return "Input";
  return layer === layerCount ? "Output" : `Hidden layer ${layer}`;
}

/**
 * The network as SVG. Meaning is never carried by colour alone:
 *  - connection sign: dashed = negative weight, solid = positive; thickness = magnitude
 *  - neuron value: printed inside the neuron; a dashed ring means a negative value;
 *    a "·" means not computed yet
 */
export function NetworkDiagram({ net, acts, current, selected, onSelect }: Props) {
  const layers = net.sizes.length;
  const height = Math.max(...net.sizes) * SPACING + 36;
  const x = (l: number) => MARGIN_X + (l * (W - 2 * MARGIN_X)) / (layers - 1);
  const y = (l: number, n: number) => height / 2 + (n - (net.sizes[l] - 1) / 2) * SPACING;
  const layerCount = layers - 1;

  const edges: React.ReactNode[] = [];
  for (let l = 0; l < net.weights.length; l++) {
    for (let t = 0; t < net.sizes[l + 1]; t++) {
      for (let f = 0; f < net.sizes[l]; f++) {
        const w = net.weights[l][t][f];
        const known = acts[l + 1][t] !== null;
        const isCurrent = current !== null && current.layer === l + 1 && current.neuron === t;
        const isSelected = selected !== null && selected.layer === l + 1 && selected.neuron === t;
        edges.push(
          <line
            key={`e-${l}-${t}-${f}`}
            x1={x(l)}
            y1={y(l, f)}
            x2={x(l + 1)}
            y2={y(l + 1, t)}
            strokeDasharray={w < 0 ? "6 4" : undefined}
            strokeWidth={0.7 + Math.min(Math.abs(w), 2) * 1.5 + (isCurrent ? 1.2 : 0)}
            style={{ stroke: w < 0 ? "var(--text-muted)" : "var(--accent)" }}
            opacity={isCurrent || isSelected ? 1 : known ? 0.7 : 0.28}
          />,
        );
        if (isSelected || isCurrent) {
          const mx = (x(l) + x(l + 1)) / 2 + (f - (net.sizes[l] - 1) / 2) * 4;
          const my = (y(l, f) + y(l + 1, t)) / 2;
          edges.push(
            <text
              key={`t-${l}-${t}-${f}`}
              x={mx}
              y={my}
              textAnchor="middle"
              fontSize={11}
              className="tabular-nums"
              style={{
                fill: "var(--text)",
                stroke: "var(--bg)",
                strokeWidth: 3,
                paintOrder: "stroke",
              }}
            >
              {fmt(w)}
            </text>,
          );
        }
      }
    }
  }

  const nodes: React.ReactNode[] = [];
  for (let l = 0; l < layers; l++) {
    nodes.push(
      <text
        key={`lbl-${l}`}
        x={x(l)}
        y={14}
        textAnchor="middle"
        fontSize={12}
        style={{ fill: "var(--text-muted)" }}
      >
        {layerName(l, layerCount)}
      </text>,
    );
    for (let n = 0; n < net.sizes[l]; n++) {
      const value = acts[l][n];
      const isSel = selected?.layer === l && selected.neuron === n;
      const isCur = current !== null && current.layer === l && current.neuron === n;
      const label =
        `${layerName(l, layerCount)} neuron ${n + 1}, ` +
        (value === null ? "not computed yet" : `value ${fmt(value)}`) +
        ". Press Enter to edit its " +
        (l === 0 ? "input value." : "weights and bias.");
      nodes.push(
        <g
          key={`n-${l}-${n}`}
          role="button"
          tabIndex={0}
          aria-label={label}
          aria-pressed={isSel}
          onClick={() => onSelect({ layer: l, neuron: n })}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect({ layer: l, neuron: n });
            }
          }}
          className="cursor-pointer outline-none [&:focus-visible>circle:last-of-type]:stroke-[3px]"
        >
          <circle cx={x(l)} cy={y(l, n)} r={RADIUS} style={{ fill: "var(--surface)" }} />
          <circle
            cx={x(l)}
            cy={y(l, n)}
            r={RADIUS}
            style={{ fill: "var(--accent)" }}
            opacity={value === null ? 0 : Math.min(1, Math.abs(value) / 1.5) * 0.85}
          />
          <circle
            cx={x(l)}
            cy={y(l, n)}
            r={RADIUS}
            fill="none"
            strokeWidth={isSel || isCur ? 3 : 1.5}
            strokeDasharray={value !== null && value < 0 ? "4 3" : undefined}
            style={{ stroke: isSel || isCur ? "var(--text)" : "var(--border-strong)" }}
          />
          <text
            x={x(l)}
            y={y(l, n) + 4}
            textAnchor="middle"
            fontSize={11}
            className="tabular-nums"
            style={{
              fill: "var(--text)",
              stroke: "var(--bg)",
              strokeWidth: 3,
              paintOrder: "stroke",
            }}
          >
            {value === null ? "·" : fmt(value)}
          </text>
        </g>,
      );
    }
  }

  return (
    <div
      className="overflow-x-auto rounded-panel"
      role="region"
      aria-label="Neural network diagram, scrollable"
      tabIndex={0}
    >
      <svg
        viewBox={`0 0 ${W} ${height}`}
        className="block h-auto w-full min-w-[720px] rounded-panel border border-line bg-surface"
        role="group"
        aria-label="Neural network diagram. Each circle is a neuron and can be selected to edit it."
      >
        {edges}
        {nodes}
      </svg>
    </div>
  );
}
