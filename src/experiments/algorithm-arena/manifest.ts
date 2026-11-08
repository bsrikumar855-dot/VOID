import { defineExperiment } from "@/engine/public";
import { arenaConfigSchema, defaultArenaConfig, type ArenaConfig } from "./config";

export const algorithmArena = defineExperiment<ArenaConfig>({
  meta: {
    id: "algorithm-arena",
    slug: "algorithm-arena",
    title: "Algorithm Arena",
    summary:
      "Race two sorting algorithms on identical data and watch every comparison, swap and write.",
    category: "Algorithms",
    tags: ["sorting", "complexity", "comparison"],
    version: 1,
  },
  configSchema: arenaConfigSchema,
  defaultConfig: defaultArenaConfig,
  examples: [
    {
      title: "When quick sort is not quick",
      note: "Reversed input is quick sort's worst case when the pivot is always the last item. Merge sort needs far fewer comparisons.",
      config: { left: "quick", right: "merge", preset: "reversed", size: 64, seed: 1 },
    },
    {
      title: "Nearly sorted data",
      note: "Insertion sort only has to nudge a few items, so it does a fraction of bubble sort's operations.",
      config: { left: "insertion", right: "bubble", preset: "nearly-sorted", size: 64, seed: 3 },
    },
    {
      title: "Only four distinct values",
      note: "Many equal items skew quick sort's partitions, so it does more comparisons than merge sort.",
      config: { left: "quick", right: "merge", preset: "few-unique", size: 64, seed: 5 },
    },
  ],
  load: () => import("./view/mount").then((m) => m.default),
});
