"use client";

import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import {
  ExperimentErrorBoundary,
  type ExperimentHandle,
  type ExperimentModule,
  type MountOptions,
} from "@/engine/public";
import type { NnConfig } from "../config";
import { Playground, type NnControls } from "./playground";

/**
 * Engine entry point for the Neural Network Playground. Same contract as every experiment:
 * React renders inside the host element; the handle drives it; destroy() is idempotent and
 * also runs when the host's AbortSignal fires.
 */
function mount(host: HTMLElement, options: MountOptions<NnConfig>): ExperimentHandle<NnConfig> {
  const root = createRoot(host);
  let controls: NnControls | null = null;
  let destroyed = false;

  flushSync(() => {
    root.render(
      <ExperimentErrorBoundary>
        <Playground
          initialConfig={options.config}
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
    // Deferred: destroy() can run inside a React effect cleanup (see arena mount.tsx).
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

const nnModule: ExperimentModule<NnConfig> = { mount };

export default nnModule;
