"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { ArenaConfig } from "../config";
import { MAX_SIZE, MAX_VALUE, MIN_SIZE } from "../limits";
import { PRESETS } from "../core/data";
import { createRace, laneAt } from "../core/sim";
import { ALGORITHMS, ALGORITHM_INFO, type AlgorithmId } from "../core/sorts";
import { LaneCanvas } from "./lane-canvas";

export interface ArenaControls {
  play(): void;
  pause(): void;
  reset(): void;
  step(): void;
  setConfig(config: ArenaConfig): void;
}

interface Props {
  initialConfig: ArenaConfig;
  presentation: "page" | "embed";
  onChange(config: ArenaConfig): void;
  register(controls: ArenaControls): void;
}

const SPEEDS = [10, 25, 60, 150, 400, 1000, 3000] as const; // operations per second
const DEFAULT_SPEED_INDEX = 3;

function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getReduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const control =
  "min-h-11 rounded-control border border-line-strong bg-surface px-3 text-ink transition-colors duration-[var(--dur-feedback)] hover:bg-raised disabled:opacity-50 aria-disabled:opacity-50";
const button = `${control} inline-flex items-center justify-center font-medium`;

const nameOf = (id: AlgorithmId) => ALGORITHM_INFO[id].name;

const PRESET_LABELS: Record<(typeof PRESETS)[number], string> = {
  random: "Random",
  reversed: "Reversed",
  "nearly-sorted": "Nearly sorted",
  "few-unique": "Few unique values",
};

function summarize(
  r: { left: { trace: unknown[] }; right: { trace: unknown[] } },
  cfg: ArenaConfig,
) {
  const lo = r.left.trace.length;
  const ro = r.right.trace.length;
  const first = lo === ro ? null : lo < ro ? nameOf(cfg.left) : nameOf(cfg.right);
  return `${first ? `${first} finished first` : "Tie"}. ${nameOf(cfg.left)}: ${lo} operations. ${nameOf(cfg.right)}: ${ro} operations.`;
}

export function Arena({ initialConfig, presentation, onChange, register }: Props) {
  const embed = presentation === "embed";
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, () => false);
  const uid = useId();

  const [config, setConfigState] = useState<ArenaConfig>(initialConfig);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(
    () => embed && !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [speedIndex, setSpeedIndex] = useState(DEFAULT_SPEED_INDEX);
  const [announcement, setAnnouncement] = useState("");
  const [showData, setShowData] = useState(false);
  const [visible, setVisible] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);

  const race = useMemo(() => createRace(config), [config]);
  const left = laneAt(race, "left", step);
  const right = laneAt(race, "right", step);
  const finished = step >= race.length;
  const maxValue = Math.max(...race.values, config.size);

  // Latest-value refs so imperative controls never see stale state.
  const stateRef = useRef({ config, race, step, onChange });
  useEffect(() => {
    stateRef.current = { config, race, step, onChange };
  });
  // Reduced motion only suppresses AUTOPLAY (initial state); a user pressing Run still runs.
  const running = playing && !finished;
  const liveText = finished && race.length > 0 ? summarize(race, config) : announcement;

  const commit = useCallback((next: ArenaConfig) => {
    setConfigState(next);
    setStep(0);
    setPlaying(false);
    setAnnouncement("Configuration changed. Race reset.");
    stateRef.current.onChange(next);
  }, []);

  // Imperative controls for the engine handle.
  useEffect(() => {
    register({
      play: () => {
        setPlaying(true);
        setAnnouncement("Race started.");
      },
      pause: () => {
        setPlaying(false);
        setAnnouncement("Race paused.");
      },
      reset: () => {
        setStep(0);
        setPlaying(false);
        setAnnouncement("Race reset.");
      },
      step: () => {
        setPlaying(false);
        setStep((s) => Math.min(stateRef.current.race.length, s + 1));
      },
      setConfig: (c) => {
        setConfigState(c);
        setStep(0);
        setPlaying(false);
      },
    });
  }, [register]);

  // Embed: pause when scrolled out of view (saves CPU), autoplay unless reduced motion.
  useEffect(() => {
    if (!embed || !rootRef.current) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    io.observe(rootRef.current);
    return () => io.disconnect();
  }, [embed]);

  // Time-based stepping. Visible state is a pure function of (config, step).
  useEffect(() => {
    if (!running || (embed && !visible)) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const tick = (now: number) => {
      const dt = Math.min(100, now - last);
      last = now;
      acc += (SPEEDS[speedIndex] * dt) / 1000;
      const whole = Math.floor(acc);
      if (whole > 0) {
        acc -= whole;
        setStep((s) => Math.min(stateRef.current.race.length, s + whole));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, speedIndex, embed, visible]);

  // Embed only: after finishing, pause briefly and loop with fresh data.
  useEffect(() => {
    if (!(embed && !reduced && finished && race.length > 0)) return;
    const t = setTimeout(() => {
      commit({ ...config, values: undefined, seed: (config.seed + 1) >>> 0 });
      setPlaying(true);
    }, 2200);
    return () => clearTimeout(t);
  }, [embed, reduced, finished, race, config, commit]);

  // Keyboard shortcuts on the whole experiment (page presentation).
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (embed) return;
    // Never steal browser shortcuts such as Ctrl+R (reload) or Ctrl+S (save).
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
    if (e.key === "s" || e.key === "S") {
      e.preventDefault();
      setPlaying(false);
      setStep((s) => Math.min(race.length, s + 1));
    } else if (e.key === "r" || e.key === "R") {
      e.preventDefault();
      setStep(0);
      setPlaying(false);
      setAnnouncement("Race reset.");
    }
  };

  // Painting data with the pointer.
  const paintRef = useRef<number[] | null>(null);
  const paintRaf = useRef(0);
  const onPaint = (index: number, value: number) => {
    if (!paintRef.current) paintRef.current = race.values.slice();
    paintRef.current[index] = Math.min(MAX_VALUE, value);
    if (!paintRaf.current) {
      paintRaf.current = requestAnimationFrame(() => {
        paintRaf.current = 0;
        const values = paintRef.current;
        if (values) commit({ ...config, size: values.length, values: values.slice() });
      });
    }
  };
  const onPaintEnd = () => {
    // Flush the last sample of the stroke so it is not dropped, then end the stroke.
    if (paintRaf.current) {
      cancelAnimationFrame(paintRaf.current);
      paintRaf.current = 0;
    }
    const values = paintRef.current;
    paintRef.current = null;
    if (values) commit({ ...config, size: values.length, values: values.slice() });
  };
  // A pending paint frame must not fire after unmount (it would write a stale share link).
  useEffect(() => () => cancelAnimationFrame(paintRaf.current), []);

  const set = (patch: Partial<ArenaConfig>) => {
    const next = { ...config, ...patch };
    // Changing the data source drops painted values so the preset/seed take effect.
    if ("preset" in patch || "seed" in patch || "size" in patch) next.values = undefined;
    commit(next);
  };

  const status = finished ? "sorted" : `step ${step} of ${race.length}`;
  const laneLabel = (id: AlgorithmId, v: typeof left) =>
    `${nameOf(id)}: ${v.counters.comparisons} comparisons, ${v.counters.swaps} swaps, ${v.counters.writes} writes${v.done ? ", sorted" : ""}.`;

  const lanes = [
    { key: "left" as const, id: config.left, view: left },
    { key: "right" as const, id: config.right, view: right },
  ];

  return (
    <div ref={rootRef} onKeyDown={onKeyDown} className="flex flex-col gap-6">
      {/* The self-running hero must not chatter at screen readers every few seconds. */}
      <p className="sr-only" aria-live="polite" role="status">
        {embed ? "" : liveText}
      </p>

      <div className={embed ? "grid gap-4" : "grid gap-6 md:grid-cols-2"}>
        {lanes.map(({ key, id, view }) => (
          <figure key={key} className="m-0 flex flex-col gap-2">
            <figcaption className="flex items-baseline justify-between gap-3">
              <span className="font-semibold">{nameOf(id)}</span>
              <span className="text-sm text-muted tabular-nums">
                {view.done ? "sorted" : status}
              </span>
            </figcaption>
            <LaneCanvas
              array={view.array}
              maxValue={maxValue}
              lastOp={view.lastOp}
              done={view.done}
              label={laneLabel(id, view)}
              className={`block w-full rounded-panel border border-line bg-surface ${embed ? "h-32 sm:h-40" : "h-48 sm:h-64"}`}
              // Painting is page-only: on the hero it would trap touch scrolling on phones.
              onPaint={key === "left" && !embed ? onPaint : undefined}
              onPaintEnd={key === "left" && !embed ? onPaintEnd : undefined}
            />
            <dl className="m-0 grid grid-cols-3 gap-2 text-sm">
              {(
                [
                  ["Comparisons", view.counters.comparisons],
                  ["Swaps", view.counters.swaps],
                  ["Writes", view.counters.writes],
                ] as const
              ).map(([name, value]) => (
                <div key={name} className="flex flex-col">
                  <dt className="text-muted">{name}</dt>
                  <dd className="m-0 font-mono text-base tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </figure>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Race controls">
        <button
          type="button"
          className={button}
          onClick={() => {
            if (finished) {
              setStep(0);
              setPlaying(true);
              setAnnouncement("Race restarted.");
            } else {
              setPlaying(!running);
              setAnnouncement(running ? "Race paused." : "Race started.");
            }
          }}
          aria-keyshortcuts={embed ? undefined : "Space"}
        >
          {finished ? "Run again" : running ? "Pause" : "Run"}
        </button>
        {!embed && (
          <>
            <button
              type="button"
              className={button}
              // aria-disabled (not disabled) so keyboard focus is not lost at the last step.
              aria-disabled={finished}
              aria-keyshortcuts="S"
              onClick={() => {
                if (finished) return;
                setPlaying(false);
                setStep((s) => Math.min(race.length, s + 1));
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
                setAnnouncement("Race reset.");
              }}
            >
              Reset
            </button>
          </>
        )}
        <label className="ml-auto flex items-center gap-2 text-sm text-muted">
          Speed
          <input
            type="range"
            min={0}
            max={SPEEDS.length - 1}
            value={speedIndex}
            onChange={(e) => setSpeedIndex(Number(e.target.value))}
            aria-valuetext={`${SPEEDS[speedIndex]} operations per second`}
            className="h-11 w-28 accent-[var(--accent)]"
          />
          <span className="w-20 tabular-nums">{SPEEDS[speedIndex]} ops/s</span>
        </label>
      </div>

      {!embed && (
        <fieldset className="grid gap-4 border-0 p-0 sm:grid-cols-2 lg:grid-cols-4">
          <legend className="sr-only">Experiment settings</legend>
          <Field label="Left algorithm" id={`${uid}-left`}>
            <select
              id={`${uid}-left`}
              className={control}
              value={config.left}
              onChange={(e) => set({ left: e.target.value as AlgorithmId })}
            >
              {ALGORITHMS.map((a) => (
                <option key={a} value={a}>
                  {nameOf(a)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Right algorithm" id={`${uid}-right`}>
            <select
              id={`${uid}-right`}
              className={control}
              value={config.right}
              onChange={(e) => set({ right: e.target.value as AlgorithmId })}
            >
              {ALGORITHMS.map((a) => (
                <option key={a} value={a}>
                  {nameOf(a)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Input data" id={`${uid}-preset`}>
            <select
              id={`${uid}-preset`}
              className={control}
              value={config.values ? "custom" : config.preset}
              onChange={(e) =>
                e.target.value !== "custom" &&
                set({ preset: e.target.value as ArenaConfig["preset"] })
              }
            >
              {config.values && <option value="custom">Painted by you</option>}
              {PRESETS.map((p) => (
                <option key={p} value={p}>
                  {PRESET_LABELS[p]}
                </option>
              ))}
            </select>
          </Field>
          <Field label={`Items: ${config.size}`} id={`${uid}-size`}>
            <input
              id={`${uid}-size`}
              type="range"
              min={MIN_SIZE}
              max={MAX_SIZE}
              value={config.size}
              onChange={(e) => set({ size: Number(e.target.value) })}
              className="h-11 accent-[var(--accent)]"
            />
          </Field>
          <Field label="Seed" id={`${uid}-seed`}>
            <div className="flex gap-2">
              {/* Uncontrolled and applied on blur/Enter so clearing the field while typing
                  does not reset the race to seed 0. Re-keyed when the seed changes elsewhere. */}
              <input
                id={`${uid}-seed`}
                key={config.seed}
                type="number"
                inputMode="numeric"
                min={0}
                max={4294967295}
                defaultValue={config.seed}
                onBlur={(e) => {
                  const n = Number(e.target.value);
                  if (
                    e.target.value !== "" &&
                    Number.isInteger(n) &&
                    n >= 0 &&
                    n <= 0xffffffff &&
                    n !== config.seed
                  ) {
                    set({ seed: n });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                className={`${control} w-full font-mono tabular-nums`}
              />
              <button
                type="button"
                className={button}
                onClick={() => set({ seed: (config.seed + 1) >>> 0 })}
              >
                Next seed
              </button>
            </div>
          </Field>
        </fieldset>
      )}

      {!embed && (
        <div className="flex flex-col gap-3">
          <p className="max-w-[65ch] text-sm text-muted">
            Draw on the left chart with a mouse or finger to paint your own data (painting needs a
            pointer; the data, size and seed controls above work from the keyboard). Shortcuts:{" "}
            <kbd>S</kbd> step, <kbd>R</kbd> reset. Legend: a bracket above two bars means they are
            being compared, a dot means a swap or write, and a solid rule under green bars means
            sorted.
          </p>
          <button
            type="button"
            className={`${button} self-start`}
            aria-expanded={showData}
            onClick={() => setShowData((v) => !v)}
          >
            {showData ? "Hide data table" : "Show data as table"}
          </button>
          {showData && (
            <div
              className="overflow-x-auto"
              role="region"
              aria-label="Current values table, scrollable"
              tabIndex={0}
            >
              <table className="min-w-full text-left text-sm">
                <caption className="pb-2 text-left text-muted">
                  Current values at step {step}; one column per item.
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className="pr-4">
                      Position
                    </th>
                    {lanes.map((l) => (
                      <th key={l.key} scope="col" className="pr-4">
                        {nameOf(l.id)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {left.array.map((_, i) => (
                    <tr key={i} className="border-t border-line">
                      <th scope="row" className="pr-4 font-normal tabular-nums">
                        {i + 1}
                      </th>
                      <td className="pr-4 font-mono tabular-nums">{left.array[i]}</td>
                      <td className="pr-4 font-mono tabular-nums">{right.array[i]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!embed && (
        <section aria-labelledby={`${uid}-about`} className="flex flex-col gap-3">
          <h2 id={`${uid}-about`} className="text-xl font-semibold">
            About these algorithms
          </h2>
          <div
            className="overflow-x-auto"
            role="region"
            aria-label="Algorithm complexity table, scrollable"
            tabIndex={0}
          >
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr>
                  <th scope="col" className="py-2 pr-4">
                    Algorithm
                  </th>
                  <th scope="col" className="py-2 pr-4">
                    Best
                  </th>
                  <th scope="col" className="py-2 pr-4">
                    Average
                  </th>
                  <th scope="col" className="py-2 pr-4">
                    Worst
                  </th>
                </tr>
              </thead>
              <tbody>
                {ALGORITHMS.map((a) => (
                  <tr key={a} className="border-t border-line align-top">
                    <th scope="row" className="py-2 pr-4 font-medium">
                      {ALGORITHM_INFO[a].name}
                    </th>
                    <td className="py-2 pr-4 font-mono whitespace-nowrap">
                      {ALGORITHM_INFO[a].best}
                    </td>
                    <td className="py-2 pr-4 font-mono whitespace-nowrap">
                      {ALGORITHM_INFO[a].average}
                    </td>
                    <td className="py-2 pr-4 font-mono whitespace-nowrap">
                      {ALGORITHM_INFO[a].worst}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="m-0 flex max-w-[65ch] list-none flex-col gap-2 p-0 text-sm text-muted">
            {[config.left, config.right].map((a) => (
              <li key={a}>
                <strong className="text-ink">{ALGORITHM_INFO[a].name}.</strong>{" "}
                {ALGORITHM_INFO[a].note}
              </li>
            ))}
          </ul>
          <p className="max-w-[65ch] text-sm text-muted">
            Both algorithms work through the same number of recorded operations at a time on
            identical data, so the one with fewer operations finishes first. At fast speeds several
            operations happen between drawn frames; the counters always include all of them and come
            from the recorded operation trace, not from timing.
          </p>
        </section>
      )}
    </div>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}
