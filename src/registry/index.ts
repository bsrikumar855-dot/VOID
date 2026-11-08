import "@/engine/zod-config"; // must be first: sets Zod's jitless flag before any schema is built
import type { AnyExperimentDefinition } from "@/engine/public";
import { algorithmArena } from "@/experiments/algorithm-arena/manifest";

/**
 * THE list of experiments. The homepage (hero = the FIRST entry, plus every example link),
 * /explore and /experiments/<slug> derive from this array; nothing else may keep its own
 * list. To add an experiment: create src/experiments/<slug>/, then add an import and one
 * entry here. (The header has a single generic Explore link; it does not list experiments.)
 */
export const experiments: readonly AnyExperimentDefinition[] = [algorithmArena];

export function listExperiments(): readonly AnyExperimentDefinition[] {
  return experiments;
}

export function getExperiment(slug: string): AnyExperimentDefinition | undefined {
  return experiments.find((e) => e.meta.slug === slug);
}
