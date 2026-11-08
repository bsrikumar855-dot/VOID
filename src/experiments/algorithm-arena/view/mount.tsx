"use client";

import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import {
  ExperimentErrorBoundary,
  type ExperimentHandle,
  type ExperimentModule,
  type MountOptions,
} from "@/engine/public";
import type { ArenaConfig } from "../config";
import { Arena, type ArenaControls } from "./arena";

/**
 * Engine entry point for the Algorithm Arena. React renders inside the host
 * element handed over by the engine; the handle drives it imperatively.
 * destroy() is idempotent and also runs when the host's AbortSignal fires.
 */
function mount(
  host: HTMLElement,
  options: MountOptions<ArenaConfig>,
): ExperimentHandle<ArenaConfig> {
  const root = createRoot(host);
  let controls: ArenaControls | null = null;
  let destroyed = false;

  flushSync(() => {
    root.render(
      <ExperimentErrorBoundary>
        <Arena
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
    // Deferred: destroy() can run inside a React effect cleanup, and React warns about
    // unmounting a root synchronously while it is already rendering/committing.
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

const arenaModule: ExperimentModule<ArenaConfig> = { mount };

export default arenaModule;
