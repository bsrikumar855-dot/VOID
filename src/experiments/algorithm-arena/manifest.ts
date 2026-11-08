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
  load: () => import("./view/mount").then((m) => m.default),
});
