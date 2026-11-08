import type { AnyExperimentDefinition } from "@/engine/public";
import { algorithmArena } from "@/experiments/algorithm-arena/manifest";

/**
 * THE list of experiments. Home, /explore, navigation, the sitemap and the
 * terminal all derive from this array; nothing else may keep its own list.
 * To add an experiment: create src/experiments/<slug>/ and add one line here.
 */
export const experiments: readonly AnyExperimentDefinition[] = [algorithmArena];

export function listExperiments(): readonly AnyExperimentDefinition[] {
  return experiments;
}

export function getExperiment(slug: string): AnyExperimentDefinition | undefined {
  return experiments.find((e) => e.meta.slug === slug);
}
