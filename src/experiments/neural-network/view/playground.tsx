"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { NnConfig } from "../config";
import {
  ACTIVATIONS,
  INPUT_LIMIT,
  MAX_INPUTS,
  MAX_LAYERS,
  MAX_LAYER_SIZE,
  PARAM_LIMIT,
  SCALE,
  defaultNnConfig,
  type ActivationId,
} from "../limits";
import {
  ACTIVATION_INFO,
  activationsAt,
  describeStep,
  forward,
  predict,
  randomParams,
  reshape,
  stepCount,
  toNet,
} from "../core/network";
import { NetworkDiagram, type Selection } from "./diagram";

export interface NnControls {
  play(): void;
  pause(): void;
  reset(): void;
  step(): void;
  setConfig(config: NnConfig): void;
}

interface Props {
  initialConfig: NnConfig;
  onChange(config: NnConfig): void;
  register(controls: NnControls): void;
}

const RATES = [0.5, 1, 2, 4, 8] as const; // neurons per second
const DEFAULT_RATE = 1;

const control =
  "min-h-11 rounded-control border border-line-strong bg-surface px-3 text-ink transition-colors duration-[var(--dur-feedback)] hover:bg-raised aria-disabled:opacity-50";
const button = `${control} inline-flex items-center justify-center font-medium`;

const fmt = (x: number) => (Math.abs(x) < 0.0005 ? 0 : x).toFixed(3);
const f2 = (scaled: number) => (scaled / SCALE).toFixed(2);

export function Playground({ initialConfig, onChange, register }: Props) {
  const uid = useId();
  const [config, setConfigState] = useState<NnConfig>(initialConfig);
  const net = useMemo(() => toNet(config), [config]);
  const result = useMemo(() => forward(net), [net]);
  const total = stepCount(net);

  // step === total means "everything computed": the live view where edits show instantly.
  const [step, setStep] = useState(total);
  const [playing, setPlaying] = useState(false);
  const [rateIndex, setRateIndex] = useState(DEFAULT_RATE);
  const [selected, setSelected] = useState<Selection | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [showTable, setShowTable] = useState(false);

  const live = useRef({ config, total, step, onChange });
  useEffect(() => {
    live.current = { config, total, step, onChange };
  });

  const finished = step >= total;
  const running = playing && !finished;
  const acts = activationsAt(net, result, step);
  // The neuron being explained: only while a run is in progress. Once every neuron is computed
  // there is no "current" neuron, the prediction takes over.
  const current = step > 0 && step < total ? result.steps[step - 1] : null;
  /** The last computed neuron, shown in the text panel even when the run is finished. */
  const lastComputed = step > 0 ? result.steps[step - 1] : null;
  const layerCount = net.sizes.length - 1;
  const outputs = result.activations[layerCount];
  const outActivation = config.layers[config.layers.length - 1].activation;
  const prediction = finished ? predict(outputs, outActivation) : null;

  // Time-based stepping through neurons.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setAnnouncement("");
      setStep((s) => Math.min(live.current.total, s + 1));
    }, 1000 / RATES[rateIndex]);
    return () => clearInterval(id);
  }, [running, rateIndex]);

  /** Apply an edit. Keeps "live" mode live; a partially stepped run keeps its position. */
  const commit = (next: NnConfig) => {
    const nextTotal = next.layers.reduce((a, l) => a + l.size, 0);
    const wasLive = live.current.step >= live.current.total;
    setAnnouncement(""); // a later explicit announcement (randomize, load) is queued after this
    setConfigState(next);
    setStep(wasLive ? nextTotal : Math.min(live.current.step, nextTotal));
    setSelected((s) =>
      s &&
      s.layer <= next.layers.length &&
      s.neuron < (s.layer === 0 ? next.inputs.length : next.layers[s.layer - 1].size)
        ? s
        : null,
    );
    live.current.onChange(next);
  };

  useEffect(() => {
    register({
      play: () => setPlaying(true),
      pause: () => setPlaying(false),
      reset: () => {
        setStep(0);
        setPlaying(false);
      },
      step: () => {
        setPlaying(false);
        setAnnouncement("");
        setStep((s) => Math.min(live.current.total, s + 1));
      },
      setConfig: (c) => {
        setConfigState(c);
        setStep(c.layers.reduce((a, l) => a + l.size, 0));
        setPlaying(false);
        setSelected(null);
      },
    });
  }, [register]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
    if (e.key === "s" || e.key === "S") {
      e.preventDefault();
      setPlaying(false);
      setAnnouncement("");
      setStep((s) => Math.min(total, s + 1));
    } else if (e.key === "r" || e.key === "R") {
      e.preventDefault();
      setStep(0);
      setPlaying(false);
      setAnnouncement("Reset. No neuron computed yet.");
    }
  };

  // ---- edits ----
  const setInput = (i: number, scaled: number) => {
    const inputs = config.inputs.slice();
    inputs[i] = scaled;
    commit({ ...config, inputs });
  };
  const weightOffset = (layer: number) => {
    // layer is 1-based; offset of its first weight in the flat array
    let off = 0;
    for (let l = 1; l < layer; l++) off += net.sizes[l] * net.sizes[l - 1];
    return off;
  };
  const setWeight = (layer: number, to: number, from: number, scaled: number) => {
    const w = config.w.slice();
    w[weightOffset(layer) + to * net.sizes[layer - 1] + from] = scaled;
    commit({ ...config, w });
  };
  const setBias = (layer: number, to: number, scaled: number) => {
    const b = config.b.slice();
    let off = 0;
    for (let l = 1; l < layer; l++) off += net.sizes[l];
    b[off + to] = scaled;
    commit({ ...config, b });
  };
  const setActivation = (layerIndex: number, activation: ActivationId) => {
    const layers = config.layers.map((l, i) => (i === layerIndex ? { ...l, activation } : l));
    commit({ ...config, layers });
  };
  const changeShape = (
    inputCount: number,
    layers: NnConfig["layers"],
    from?: ReadonlyArray<number | null>,
  ) => {
    commit(reshape(config, { inputCount, layers, from }));
  };
  const randomize = () => {
    const seed = (config.seed + 1) >>> 0;
    const { w, b } = randomParams(
      config.inputs.length,
      config.layers.map((l) => l.size),
      seed,
    );
    commit({ ...config, w, b, seed });
    setAnnouncement("Weights randomized with a new seed. Biases reset to zero.");
  };

  const selectedLayer = selected?.layer ?? 0;
  // Selecting a neuron (Enter on the diagram) moves focus to the editor heading so keyboard and
  // screen-reader users land on what they opened, instead of having to tab past the controls.
  const editHeading = useRef<HTMLHeadingElement>(null);
  const selLayer = selected?.layer;
  const selNeuron = selected?.neuron;
  useEffect(() => {
    if (selLayer !== undefined) editHeading.current?.focus();
  }, [selLayer, selNeuron]);
  // Explicit announcements (reset, randomize, load) win; otherwise the neuron being explained,
  // otherwise the finished prediction.
  const liveText =
    announcement || (current ? describeStep(current, layerCount) : (prediction?.summary ?? ""));

  return (
    <div onKeyDown={onKeyDown} className="flex min-w-0 flex-col gap-8">
      <p className="sr-only" aria-live="polite" role="status">
        {liveText}
      </p>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-8">
          <p className="m-0 text-xs text-muted md:hidden">
            Scroll the diagram sideways to see every layer.
          </p>
          <NetworkDiagram
            net={net}
            acts={acts}
            current={current}
            selected={selected}
            onSelect={setSelected}
          />

          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Run controls">
            <button
              type="button"
              className={button}
              onClick={() => {
                if (finished) {
                  setAnnouncement("Replaying from the first neuron.");
                  setStep(0);
                  setPlaying(true);
                } else setPlaying(!running);
              }}
            >
              {finished ? "Replay" : running ? "Pause" : "Run"}
            </button>
            <button
              type="button"
              className={button}
              aria-disabled={finished}
              aria-keyshortcuts="S"
              onClick={() => {
                if (finished) return;
                setPlaying(false);
                setAnnouncement("");
                setStep((s) => Math.min(total, s + 1));
              }}
            >
              Step
            </button>
            <button
              type="button"
              className={button}
              aria-keyshortcuts="R"
              onClick={() => {
                setStep(0);
                setPlaying(false);
                setAnnouncement("Reset. No neuron computed yet.");
              }}
            >
              Reset
            </button>
            <button
              type="button"
              className={button}
              aria-disabled={finished}
              onClick={() => {
                if (finished) return;
                setPlaying(false);
                setAnnouncement("");
                setStep(total);
              }}
            >
              Compute all
            </button>
            <label className="ml-auto flex items-center gap-2 text-sm text-muted">
              Speed
              <input
                type="range"
                min={0}
                max={RATES.length - 1}
                name="speed"
                value={rateIndex}
                onChange={(e) => setRateIndex(Number(e.target.value))}
                aria-valuetext={`${RATES[rateIndex]} ${RATES[rateIndex] === 1 ? "neuron" : "neurons"} per second`}
                className="h-11 w-24 accent-[var(--accent)]"
              />
              <span className="w-24 tabular-nums">
                {RATES[rateIndex]} {RATES[rateIndex] === 1 ? "neuron" : "neurons"}/s
              </span>
            </label>
          </div>

          <div className="rounded-panel border border-line bg-surface px-4 py-3" aria-live="off">
            <p className="m-0 text-sm text-muted">
              {finished ? "All neurons computed." : `Neuron ${step} of ${total} computed.`}
            </p>
            <p className="m-0 mt-1 min-h-12 max-w-[75ch] tabular-nums">
              {lastComputed
                ? describeStep(lastComputed, layerCount)
                : "Press Step or Run to compute the network one neuron at a time, or Compute all to see every value."}
            </p>
          </div>
        </div>

        <aside
          className="flex min-w-0 flex-col gap-6 lg:col-span-4"
          aria-label="Inputs and prediction"
        >
          <section aria-labelledby={`${uid}-in`} className="flex flex-col gap-3">
            <h2 id={`${uid}-in`} className="text-lg font-semibold">
              Inputs
            </h2>
            {config.inputs.map((v, i) => (
              <label key={i} className="flex flex-col gap-1 text-sm">
                <span className="flex justify-between text-muted">
                  <span>Input x{i + 1}</span>
                  <span className="tabular-nums text-ink">{f2(v)}</span>
                </span>
                <input
                  type="range"
                  min={-INPUT_LIMIT}
                  max={INPUT_LIMIT}
                  step={1}
                  name={`input-${i}`}
                  value={v}
                  onChange={(e) => setInput(i, Number(e.target.value))}
                  aria-valuetext={f2(v)}
                  className="h-11 accent-[var(--accent)]"
                />
              </label>
            ))}
            {config.inputs.length === 2 && (
              <div className="flex flex-wrap gap-2" role="group" aria-label="Binary input presets">
                {[
                  [0, 0],
                  [100, 0],
                  [0, 100],
                  [100, 100],
                ].map(([a, b]) => (
                  <button
                    key={`${a}${b}`}
                    type="button"
                    className={`${button} px-3 tabular-nums`}
                    onClick={() => commit({ ...config, inputs: [a, b] })}
                  >
                    {a / SCALE}, {b / SCALE}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby={`${uid}-out`} className="flex flex-col gap-2">
            <h2 id={`${uid}-out`} className="text-lg font-semibold">
              Prediction
            </h2>
            {prediction ? (
              <>
                <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-1 p-0">
                  {prediction.values.map((v, i) => (
                    <li key={i} className="tabular-nums">
                      <span className="text-muted">Output {i + 1}: </span>
                      <span className="font-mono text-lg">{fmt(v)}</span>
                      {outputs.length > 1 && i === prediction.best ? <span> (largest)</span> : null}
                    </li>
                  ))}
                </ul>
                <p className="m-0 max-w-[48ch] text-sm text-muted">{prediction.summary}</p>
              </>
            ) : (
              <p className="m-0 text-sm text-muted">Appears once the last neuron is computed.</p>
            )}
          </section>
        </aside>
      </div>

      {selected && (
        <section
          aria-labelledby={`${uid}-edit`}
          className="rounded-panel border border-line-strong bg-surface p-4"
        >
          <div className="flex items-baseline justify-between gap-3">
            <h2
              id={`${uid}-edit`}
              ref={editHeading}
              tabIndex={-1}
              className="text-lg font-semibold"
            >
              {selectedLayer === 0
                ? `Input x${selected.neuron + 1}`
                : `${selectedLayer === layerCount ? "Output" : `Hidden layer ${selectedLayer}`}, neuron ${selected.neuron + 1}`}
            </h2>
            <button type="button" className={button} onClick={() => setSelected(null)}>
              Close editor
            </button>
          </div>
          {selectedLayer === 0 ? (
            <p className="mt-2 text-sm text-muted">
              Change this input with the slider under Inputs, or select a later neuron to edit its
              weights.
            </p>
          ) : (
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="flex justify-between text-muted">
                  <span>Bias</span>
                  <span className="tabular-nums text-ink">
                    {f2(config.b[biasIndex(net.sizes, selectedLayer, selected.neuron)])}
                  </span>
                </span>
                <input
                  type="range"
                  min={-PARAM_LIMIT}
                  max={PARAM_LIMIT}
                  name="bias"
                  value={config.b[biasIndex(net.sizes, selectedLayer, selected.neuron)]}
                  onChange={(e) => setBias(selectedLayer, selected.neuron, Number(e.target.value))}
                  className="h-11 accent-[var(--accent)]"
                />
              </label>
              {Array.from({ length: net.sizes[selectedLayer - 1] }, (_, from) => {
                const idx =
                  weightOffset(selectedLayer) +
                  selected.neuron * net.sizes[selectedLayer - 1] +
                  from;
                return (
                  <label key={from} className="flex flex-col gap-1 text-sm">
                    <span className="flex justify-between text-muted">
                      <span>Weight from {sourceName(selectedLayer - 1, from, layerCount)}</span>
                      <span className="tabular-nums text-ink">{f2(config.w[idx])}</span>
                    </span>
                    <input
                      type="range"
                      min={-PARAM_LIMIT}
                      max={PARAM_LIMIT}
                      name={`weight-from-${from}`}
                      value={config.w[idx]}
                      onChange={(e) =>
                        setWeight(selectedLayer, selected.neuron, from, Number(e.target.value))
                      }
                      className="h-11 accent-[var(--accent)]"
                    />
                  </label>
                );
              })}
            </div>
          )}
        </section>
      )}

      <section aria-labelledby={`${uid}-arch`} className="flex flex-col gap-4">
        <h2 id={`${uid}-arch`} className="text-xl font-semibold">
          Architecture
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Inputs</span>
            <select
              className={control}
              name="input-count"
              value={config.inputs.length}
              onChange={(e) => changeShape(Number(e.target.value), config.layers)}
            >
              {Array.from({ length: MAX_INPUTS }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          {config.layers.map((layer, i) => {
            const isOut = i === config.layers.length - 1;
            const name = isOut ? "Output layer" : `Hidden layer ${i + 1}`;
            return (
              <fieldset key={i} className="flex flex-col gap-2 border-0 p-0">
                <legend className="mb-1 text-sm text-muted">{name}</legend>
                <div className="flex gap-2">
                  <label className="flex-1">
                    <span className="sr-only">{name} neurons</span>
                    <select
                      className={`${control} w-full`}
                      name={`layer-${i}-size`}
                      value={layer.size}
                      onChange={(e) =>
                        changeShape(
                          config.inputs.length,
                          config.layers.map((l, k) =>
                            k === i ? { ...l, size: Number(e.target.value) } : l,
                          ),
                        )
                      }
                    >
                      {Array.from({ length: MAX_LAYER_SIZE }, (_, k) => k + 1).map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? "neuron" : "neurons"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex-1">
                    <span className="sr-only">{name} activation</span>
                    <select
                      className={`${control} w-full`}
                      name={`layer-${i}-activation`}
                      value={layer.activation}
                      onChange={(e) => setActivation(i, e.target.value as ActivationId)}
                    >
                      {ACTIVATIONS.map((a) => (
                        <option key={a} value={a}>
                          {ACTIVATION_INFO[a].name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {!isOut && (
                  <button
                    type="button"
                    className={button}
                    onClick={() =>
                      changeShape(
                        config.inputs.length,
                        config.layers.filter((_, k) => k !== i),
                        config.layers.map((_, k) => k).filter((k) => k !== i),
                      )
                    }
                    disabled={config.layers.length <= 1}
                  >
                    Remove this layer
                  </button>
                )}
              </fieldset>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={button}
            aria-disabled={config.layers.length >= MAX_LAYERS}
            onClick={() => {
              if (config.layers.length >= MAX_LAYERS) return;
              const layers = config.layers.slice();
              layers.splice(layers.length - 1, 0, { size: 3, activation: "relu" });
              // The new layer sits before the output; the output stays the output.
              const from: Array<number | null> = config.layers.map((_, k) => k);
              from.splice(from.length - 1, 0, null);
              changeShape(config.inputs.length, layers, from);
            }}
          >
            Add hidden layer
          </button>
          <button type="button" className={button} onClick={randomize}>
            Randomize weights
          </button>
          <button
            type="button"
            className={button}
            onClick={() => {
              commit(defaultNnConfig);
              setPlaying(false);
              setAnnouncement("Loaded the hand-built XOR network.");
            }}
          >
            Load XOR example
          </button>
        </div>
        <p className="m-0 max-w-[70ch] text-sm text-muted">
          Select any neuron in the diagram (Tab to reach it, Enter to open) to edit its weights and
          bias. Editing the shape keeps the value of every weight whose layer, neuron and input
          still exist; new connections start small and random, so adding a layer changes what the
          network computes. Shortcuts: <kbd>S</kbd> step, <kbd>R</kbd> reset.
        </p>
      </section>

      <section aria-labelledby={`${uid}-how`} className="flex flex-col gap-3">
        <h2 id={`${uid}-how`} className="text-xl font-semibold">
          How to read this
        </h2>
        <div className="grid max-w-[70ch] gap-3 text-muted">
          <p className="m-0">
            Every neuron does the same two things. First it adds up its inputs, each multiplied by
            the weight of its connection, plus its own bias:{" "}
            <span className="font-mono text-ink">z = (a₁ × w₁) + (a₂ × w₂) + … + bias</span>. Then
            it passes that sum through an activation function to get its own value.
          </p>
          <p className="m-0">
            In the diagram, a <strong className="text-ink">solid</strong> line is a positive weight,
            a <strong className="text-ink">dashed</strong> line is negative, and thicker means
            larger. The number inside a neuron is its value; a dashed ring means the value is
            negative; a dot means it has not been computed yet.
          </p>
          <p className="m-0">
            The default is a network built by hand to compute XOR (1 only when exactly one input is
            1): hidden neuron 1 is relu(x₁ + x₂), hidden neuron 2 is relu(x₁ + x₂ − 1), and the
            output is h₁ − 2 × h₂. Try the four binary input presets. No training happens here; the
            weights are the ones you set or randomize.
          </p>
        </div>
        <dl className="m-0 grid max-w-[70ch] gap-2 text-sm">
          {Array.from(new Set(config.layers.map((l) => l.activation))).map((a) => (
            <div key={a} className="grid gap-0.5">
              <dt className="font-medium text-ink">
                {ACTIVATION_INFO[a].name}:{" "}
                <span className="font-mono">{ACTIVATION_INFO[a].formula}</span>
              </dt>
              <dd className="m-0 text-muted">{ACTIVATION_INFO[a].note}</dd>
            </div>
          ))}
        </dl>
        <p className="m-0 max-w-[70ch] text-sm text-muted">
          Values are computed in ordinary floating point and shown to 3 decimals. Sigmoid and tanh
          can differ in the last digits between browsers, which the display hides.
        </p>
      </section>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          className={`${button} self-start`}
          aria-expanded={showTable}
          onClick={() => setShowTable((v) => !v)}
        >
          {showTable ? "Hide values table" : "Show values as table"}
        </button>
        {showTable && (
          <div
            className="overflow-x-auto"
            role="region"
            aria-label="Network values table, scrollable"
            tabIndex={0}
          >
            <table className="min-w-full text-left text-sm">
              <caption className="pb-2 text-left text-muted">
                Every neuron&apos;s weights, bias, sum z and value (3 decimals).
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="pr-4">
                    Neuron
                  </th>
                  <th scope="col" className="pr-4">
                    Weights
                  </th>
                  <th scope="col" className="pr-4">
                    Bias
                  </th>
                  <th scope="col" className="pr-4">
                    z
                  </th>
                  <th scope="col" className="pr-4">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.steps.map((s, i) => (
                  <tr key={i} className="border-t border-line">
                    <th scope="row" className="pr-4 font-normal">
                      {s.layer === layerCount ? "Output" : `Hidden ${s.layer}`} {s.neuron + 1}
                    </th>
                    <td className="pr-4 font-mono tabular-nums">
                      {s.terms.map((t) => fmt(t.w)).join(", ")}
                    </td>
                    <td className="pr-4 font-mono tabular-nums">{fmt(s.bias)}</td>
                    <td className="pr-4 font-mono tabular-nums">{i < step ? fmt(s.z) : "·"}</td>
                    <td className="pr-4 font-mono tabular-nums">{i < step ? fmt(s.out) : "·"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function biasIndex(sizes: number[], layer: number, neuron: number): number {
  let off = 0;
  for (let l = 1; l < layer; l++) off += sizes[l];
  return off + neuron;
}

function sourceName(layer: number, neuron: number, layerCount: number): string {
  if (layer === 0) return `input x${neuron + 1}`;
  return `${layer === layerCount ? "output" : `hidden ${layer}`} neuron ${neuron + 1}`;
}
