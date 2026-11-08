import type { ZodType } from "zod";

/**
 * Experiment engine contract (ADR 0002 D1). Deliberately small:
 * a definition (static facts + lazy loader) and a handle (what a mounted
 * experiment exposes). The registry, not the instance, knows what is loaded.
 */

export interface ExperimentMeta {
  /** Stable machine id. Appears in share links; never change it. */
  readonly id: string;
  /** URL segment: /experiments/<slug>. */
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly category: string;
  readonly tags: readonly string[];
  /** Config schema version; share links carry it (see engine/share). */
  readonly version: number;
}

export interface MountOptions<C> {
  config: C;
  /**
   * "page": the full experience with all controls and explanation.
   * "embed": compact, self-running presentation (e.g. the homepage hero).
   */
  presentation?: "page" | "embed";
  /** Aborted when the host unmounts; handles must also be safe to destroy() directly. */
  signal: AbortSignal;
  /** Called when the user changes the configuration inside the experiment. */
  onChange(config: C): void;
}

export type ExperimentStatus = "idle" | "running" | "paused" | "done" | "error";

export interface ExperimentHandle<C> {
  play(): void;
  pause(): void;
  reset(): void;
  step(): void;
  setConfig(config: C): void;
  /** Idempotent. Releases timers, listeners and animation frames. */
  destroy(): void;
}

export interface ExperimentModule<C> {
  mount(host: HTMLElement, options: MountOptions<C>): ExperimentHandle<C>;
}

export interface ExperimentDefinition<C = unknown> {
  readonly meta: ExperimentMeta;
  /** Strict schema. The seed (if any) is part of the config. */
  readonly configSchema: ZodType<C>;
  readonly defaultConfig: C;
  /** The lazy boundary: heavy code lives behind this import. */
  load(): Promise<ExperimentModule<C>>;
}

/**
 * Type-erased definition for the registry, which holds experiments with
 * different config types. Hosts re-validate every config with `configSchema`
 * before use, so the erasure is safe at that boundary.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyExperimentDefinition = ExperimentDefinition<any>;
