// Placeholder replaced by the real view in the next commit; keeps the loader resolvable for contract tests.
import type { ExperimentModule } from "@/engine/public";
import type { ArenaConfig } from "../config";

const mod: ExperimentModule<ArenaConfig> = {
  mount() {
    throw new Error("Arena view not implemented yet");
  },
};
export const mount = mod.mount;
