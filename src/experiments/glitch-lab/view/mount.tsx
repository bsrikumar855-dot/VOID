"use client";

import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import {
  ExperimentErrorBoundary,
  type ExperimentHandle,
  type ExperimentModule,
  type MountOptions,
} from "@/engine/public";
import type { GlitchConfig } from "../config";
import { GlitchLab, type GlitchControls } from "./glitch-lab";

/**
 * Engine entry point for Glitch Lab. Same contract as every experiment: React renders inside
 * the host element; the handle drives it; destroy() is idempotent and also runs when the host's
 * AbortSignal fires (the WebGL context is released in the component's effect cleanup).
 */
function mount(
  host: HTMLElement,
  options: MountOptions<GlitchConfig>,
): ExperimentHandle<GlitchConfig> {
  const root = createRoot(host);
  let controls: GlitchControls | null = null;
  let destroyed = false;

  flushSync(() => {
    root.render(
      <ExperimentErrorBoundary>
        <GlitchLab
          initialConfig={options.config}
          presentation={options.presentation ?? "page"}
          onChange={options.onChange}
          register={(c) => {
            controls = c;
          }}
        />
      </ExperimentErrorBoundary>,
    );
  });

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    controls = null;
    // Deferred: destroy() can run inside a React effect cleanup (see the arena's mount.tsx).
    queueMicrotask(() => root.unmount());
  };
  options.signal.addEventListener("abort", destroy, { once: true });
  if (options.signal.aborted) destroy();

  return {
    play: () => controls?.play(),
    pause: () => controls?.pause(),
    reset: () => controls?.reset(),
    step: () => controls?.step(),
    setConfig: (c) => controls?.setConfig(c),
    destroy,
  };
}

const glitchLabModule: ExperimentModule<GlitchConfig> = { mount };

export default glitchLabModule;
