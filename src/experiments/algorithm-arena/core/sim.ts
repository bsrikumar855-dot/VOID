import type { ArenaConfig } from "../config";
import { makeData } from "./data";
import { countOps, runSort, stateAt, type Counters, type Op } from "./sorts";

/** The data both algorithms race on: explicit painted values, else the seeded preset. */
export function dataFor(config: ArenaConfig): number[] {
  return config.values ? config.values.slice() : makeData(config.preset, config.size, config.seed);
}

export interface Lane {
  trace: Op[];
  sorted: number[];
}

export interface Race {
  values: number[];
  left: Lane;
  right: Lane;
  /** Steps until the slower lane finishes. */
  length: number;
}

/** Precompute both traces. Cost is bounded by MAX_SIZE (128): at most ~16k ops per lane. */
export function createRace(config: ArenaConfig): Race {
  const values = dataFor(config);
  const left = runSort(config.left, values);
  const right = runSort(config.right, values);
  return { values, left, right, length: Math.max(left.trace.length, right.trace.length) };
}

export interface LaneView {
  array: number[];
  counters: Counters;
  /** The operation just applied, if any (for highlighting). */
  lastOp: Op | null;
  done: boolean;
}

/** Visible state of one lane at race step `step`: a pure function of (race, step). */
export function laneAt(race: Race, lane: "left" | "right", step: number): LaneView {
  const l = race[lane];
  const applied = Math.min(step, l.trace.length);
  return {
    array: stateAt(race.values, l.trace, applied),
    counters: countOps(l.trace, applied),
    lastOp: applied > 0 ? l.trace[applied - 1] : null,
    done: applied >= l.trace.length,
  };
}
