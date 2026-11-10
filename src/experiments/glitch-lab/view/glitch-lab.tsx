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
import { mulberry32 } from "@/engine/public";
import type { GlitchConfig } from "../config";
import {
  EFFECT_KEYS,
  EFFECT_MAX,
  FPS,
  IMAGE_SIZE,
  MAX_POSTERIZE,
  PHASE_MAX,
  SEED_MAX,
  SOURCES,
  defaultGlitchConfig,
} from "../limits";
import { makeSource } from "../core/source";
import {
  EFFECT_INFO,
  SOURCE_LABELS,
  configKey,
  describeGlitch,
  exportFileName,
} from "../core/text";
import { createCpuRenderer, createGlRenderer, type Renderer } from "./renderers";

export interface GlitchControls {
  play(): void;
  pause(): void;
  reset(): void;
  step(): void;
  setConfig(config: GlitchConfig): void;
}

interface Props {
  initialConfig: GlitchConfig;
  presentation: "page" | "embed";
  onChange(config: GlitchConfig): void;
  register(controls: GlitchControls): void;
}

const control =
  "min-h-11 rounded-control border border-line-strong bg-surface px-3 text-ink transition-colors duration-[var(--dur-feedback)] hover:bg-raised aria-disabled:opacity-50";
const button = `${control} inline-flex items-center justify-center font-medium`;

const REDUCED = "(prefers-reduced-motion: reduce)";
function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia(REDUCED);
      mq.addEventListener("change", notify);
      return () => mq.removeEventListener("change", notify);
    },
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );
}

const wrapPhase = (n: number) => ((n % (PHASE_MAX + 1)) + (PHASE_MAX + 1)) % (PHASE_MAX + 1);

export function GlitchLab({ initialConfig, presentation, onChange, register }: Props) {
  const uid = useId();
  const embed = presentation === "embed";
  const reduced = useReducedMotion();
  const [config, setConfigState] = useState<GlitchConfig>(initialConfig);
  const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState<"gl" | "cpu">("gl");
  const [rendererKind, setRendererKind] = useState<Renderer["kind"] | null>(null);
  const [message, setMessage] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const sourceKey = useRef("");

  const live = useRef({ config, onChange });
  useEffect(() => {
    live.current = { config, onChange };
  });

  // The source image is a pure function of (kind, seed).
  const source = useMemo(
    () => makeSource(config.source, config.seed),
    [config.source, config.seed],
  );

  // The renderer lives exactly as long as its canvas element: a ref callback (with a cleanup
  // function) starts it on attach and releases it on detach. The canvas is keyed by mode
  // because an element can hold only one kind of context, so a failed WebGL attempt switches
  // to a fresh element for the CPU renderer. Startup waits for the first paint and then runs in
  // its own tasks (shader linking is asynchronous), so it never blocks the page becoming usable.
  const attachCanvas = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (!canvas) return;
      canvasRef.current = canvas;
      const abort = new AbortController();
      let renderer: Renderer | null = null;
      const onLost = (e: Event) => {
        e.preventDefault();
        setMode("cpu");
      };
      (async () => {
        await new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
        if (abort.signal.aborted) return;
        const created =
          mode === "gl" ? await createGlRenderer(canvas, abort.signal) : createCpuRenderer(canvas);
        if (abort.signal.aborted) {
          created?.destroy();
          return;
        }
        if (!created) {
          if (mode === "gl") setMode("cpu");
          else setRendererKind(null);
          return;
        }
        renderer = created;
        rendererRef.current = created;
        sourceKey.current = "";
        canvas.addEventListener("webglcontextlost", onLost);
        setRendererKind(created.kind);
      })();
      return () => {
        abort.abort();
        canvas.removeEventListener("webglcontextlost", onLost);
        renderer?.destroy();
        rendererRef.current = null;
        canvasRef.current = null;
      };
    },
    [mode],
  );

  // Draw whenever the configuration (or renderer) changes.
  useEffect(() => {
    const r = rendererRef.current;
    const canvas = canvasRef.current;
    if (!r || !canvas || !rendererKind) return;
    const key = `${config.source}:${config.seed}:${mode}`;
    if (sourceKey.current !== key) {
      r.setSource(source);
      sourceKey.current = key;
    }
    r.render(config);
    // Tells tests (and nothing else) which exact configuration is on screen.
    canvas.dataset.drawn = configKey(config);
  }, [config, source, mode, rendererKind]);

  // Opt-in animation: a fixed number of frames per second, one phase step per frame.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      if (t - last >= 1000 / FPS) {
        last = t;
        setConfigState((c) => ({ ...c, phase: wrapPhase(c.phase + 1) }));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const commit = (next: GlitchConfig) => {
    setConfigState(next);
    live.current.onChange(next);
  };
  const pause = () => {
    setPlaying(false);
    // The frame the animation stopped on becomes the shareable state.
    live.current.onChange(live.current.config);
  };

  useEffect(() => {
    register({
      play: () => setPlaying(true),
      pause: () => {
        setPlaying(false);
        live.current.onChange(live.current.config);
      },
      reset: () => {
        setPlaying(false);
        const next = { ...live.current.config, phase: 0 };
        setConfigState(next);
        live.current.onChange(next);
      },
      step: () => {
        setPlaying(false);
        const next = { ...live.current.config, phase: wrapPhase(live.current.config.phase + 1) };
        setConfigState(next);
        live.current.onChange(next);
      },
      setConfig: (c) => {
        setPlaying(false);
        setConfigState(c);
      },
    });
  }, [register]);

  const setEffect = (key: (typeof EFFECT_KEYS)[number], value: number) =>
    commit({ ...config, [key]: value });

  const randomize = () => {
    const seed = (config.seed + 1) % (SEED_MAX + 1);
    const rand = mulberry32(seed);
    const pick = () => Math.floor(rand() * (EFFECT_MAX + 1));
    commit({
      ...config,
      seed,
      blocks: pick(),
      wave: pick(),
      shift: pick(),
      noise: Math.floor(pick() / 2),
      scan: pick(),
      posterize: rand() < 0.4 ? 2 + Math.floor(rand() * (MAX_POSTERIZE - 1)) : 0,
    });
    setMessage(`Effects randomized from seed ${seed}.`);
  };

  const download = async () => {
    const r = rendererRef.current;
    if (!r) return;
    const blob = await r.toBlob();
    if (!blob) {
      setMessage("Could not create the PNG.");
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportFileName(live.current.config);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    setMessage(`Saved ${a.download} (${IMAGE_SIZE} by ${IMAGE_SIZE} pixels).`);
  };

  const canvas = (
    <canvas
      key={mode}
      ref={attachCanvas}
      width={IMAGE_SIZE}
      height={IMAGE_SIZE}
      role="img"
      aria-label={describeGlitch(config)}
      data-renderer={rendererKind ?? "none"}
      className="aspect-square w-full max-w-[34rem] rounded-panel border border-line bg-surface [image-rendering:pixelated]"
    />
  );

  if (embed) return <div className="flex justify-center">{canvas}</div>;

  const posterizeSlider = config.posterize === 0 ? 0 : config.posterize - 1;

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <p className="sr-only" aria-live="polite" role="status">
        {message}
      </p>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-7">
          {canvas}
          <p className="m-0 text-sm text-muted">
            Frame {config.phase}. Drawn on the{" "}
            {rendererKind === "webgl2"
              ? "GPU (WebGL 2)"
              : rendererKind === "cpu"
                ? "CPU, because WebGL 2 is not available here (same pixels, slower)"
                : "…"}
            .
          </p>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Playback">
            <button
              type="button"
              className={button}
              aria-pressed={playing}
              onClick={() => (playing ? pause() : setPlaying(true))}
            >
              {playing ? "Pause" : "Play"}
            </button>
            <button
              type="button"
              className={button}
              onClick={() => {
                setPlaying(false);
                commit({ ...config, phase: wrapPhase(config.phase + 1) });
              }}
            >
              Step frame
            </button>
            <button
              type="button"
              className={button}
              onClick={() => {
                setPlaying(false);
                commit({ ...config, phase: 0 });
              }}
            >
              Back to frame 0
            </button>
            <button type="button" className={`${button} ml-auto`} onClick={download}>
              Download PNG
            </button>
          </div>
          <p className="m-0 max-w-[60ch] text-sm text-muted">
            Animation never starts by itself
            {reduced ? ", and your system asks for reduced motion" : ""}. Glitch effects can
            flicker; press Play only if that is comfortable for you.
          </p>
        </div>

        <div className="flex min-w-0 flex-col gap-5 lg:col-span-5">
          <h2 className="m-0 text-lg font-semibold">Image</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Test image</span>
              <select
                className={control}
                name="source"
                value={config.source}
                onChange={(e) =>
                  commit({ ...config, source: e.target.value as GlitchConfig["source"] })
                }
              >
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {SOURCE_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Seed (0 to {SEED_MAX})</span>
              <input
                className={control}
                type="number"
                name="seed"
                min={0}
                max={SEED_MAX}
                step={1}
                value={config.seed}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isInteger(v) && v >= 0 && v <= SEED_MAX)
                    commit({ ...config, seed: v });
                }}
              />
            </label>
          </div>

          <h2 className="m-0 mt-2 text-lg font-semibold">Effects</h2>
          <p className="m-0 text-sm text-muted">
            Applied top to bottom, then posterize, noise and scanlines.
          </p>
          {EFFECT_KEYS.map((key) => (
            <label key={key} className="flex flex-col gap-1 text-sm">
              <span className="flex justify-between text-muted">
                <span>{EFFECT_INFO[key].label}</span>
                <span className="tabular-nums text-ink">{config[key]}</span>
              </span>
              <input
                type="range"
                name={key}
                min={0}
                max={EFFECT_MAX}
                step={1}
                value={config[key]}
                onChange={(e) => setEffect(key, Number(e.target.value))}
                aria-describedby={`${uid}-${key}`}
                className="h-11 accent-[var(--accent)]"
              />
              <span id={`${uid}-${key}`} className="text-xs text-muted">
                {EFFECT_INFO[key].help}
              </span>
            </label>
          ))}
          <label className="flex flex-col gap-1 text-sm">
            <span className="flex justify-between text-muted">
              <span>Posterize</span>
              <span className="tabular-nums text-ink">
                {config.posterize === 0 ? "off" : `${config.posterize} levels`}
              </span>
            </span>
            <input
              type="range"
              name="posterize"
              min={0}
              max={MAX_POSTERIZE - 1}
              step={1}
              value={posterizeSlider}
              onChange={(e) => {
                const v = Number(e.target.value);
                commit({ ...config, posterize: v === 0 ? 0 : v + 1 });
              }}
              aria-valuetext={
                config.posterize === 0 ? "off" : `${config.posterize} levels per channel`
              }
              aria-describedby={`${uid}-posterize`}
              className="h-11 accent-[var(--accent)]"
            />
            <span id={`${uid}-posterize`} className="text-xs text-muted">
              Rounds each colour channel to this many evenly spaced values.
            </span>
          </label>

          <div className="flex flex-wrap gap-2">
            <button type="button" className={button} onClick={randomize}>
              Randomize effects
            </button>
            <button
              type="button"
              className={button}
              onClick={() => {
                commit({ ...defaultGlitchConfig });
                setPlaying(false);
                setMessage("Back to the default settings.");
              }}
            >
              Default settings
            </button>
          </div>
        </div>
      </div>

      <section aria-labelledby={`${uid}-how`} className="flex flex-col gap-3">
        <h2 id={`${uid}-how`} className="text-xl font-semibold">
          How to read this
        </h2>
        <div className="grid max-w-[70ch] gap-3 text-muted">
          <p className="m-0">
            There is no uploaded picture: the test image is generated from the image type and the
            seed, so a share link needs only a handful of numbers and reproduces one exact frame.
          </p>
          <p className="m-0">
            Every pixel of the {IMAGE_SIZE} by {IMAGE_SIZE} result is computed independently by a
            small program on your graphics card (a fragment shader). It uses whole-number arithmetic
            only, so the same settings give the same pixels on any graphics card and on the
            processor-only fallback; the tests compare them byte for byte. Download PNG saves
            exactly what you see.
          </p>
          <p className="m-0">
            Frame numbers drive the moving effects. Step frame advances by one; Play advances {FPS}{" "}
            frames a second, and pausing makes the current frame the one in your link.
          </p>
        </div>
      </section>
    </div>
  );
}
