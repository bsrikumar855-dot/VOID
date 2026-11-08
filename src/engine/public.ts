/**
 * The only module experiments may import from the engine (lint-enforced).
 * Anything not re-exported here is internal and free to change.
 */
export type {
  AnyExperimentDefinition,
  ExperimentDefinition,
  ExperimentExample,
  ExperimentHandle,
  ExperimentMeta,
  ExperimentModule,
  ExperimentStatus,
  MountOptions,
} from "./types";

import type { ExperimentDefinition } from "./types";

/** Identity helper that gives experiment authors full type inference on `C`. */
export function defineExperiment<C>(definition: ExperimentDefinition<C>): ExperimentDefinition<C> {
  return definition;
}
