import { describe, expect, it } from "vitest";
import { mulberry32 } from "@/experiments/algorithm-arena/core/prng";
import { PRESETS, makeData } from "@/experiments/algorithm-arena/core/data";
import {
  ALGORITHMS,
  applyOp,
  countOps,
  runSort,
  stateAt,
} from "@/experiments/algorithm-arena/core/sorts";
import { createRace, laneAt } from "@/experiments/algorithm-arena/core/sim";
import { defaultArenaConfig } from "@/experiments/algorithm-arena/config";

const isSorted = (a: readonly number[]) => a.every((v, i) => i === 0 || a[i - 1] <= v);
const sameMultiset = (a: readonly number[], b: readonly number[]) =>
  [...a].sort((x, y) => x - y).join() === [...b].sort((x, y) => x - y).join();

describe("prng", () => {
  it("is deterministic", () => {
    const a = mulberry32(1);
    const b = mulberry32(1);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
  it("matches a golden sequence (changing it changes every shared link's data)", () => {
    const r = mulberry32(1);
    const seq = [r(), r(), r()].map((x) => Number(x.toFixed(8)));
    // Computed with an independent Python implementation of mulberry32, not by this code.
    expect(seq).toEqual([0.62707394, 0.00273572, 0.52744704]);
  });
  it("different seeds give different streams", () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });
});

describe("makeData", () => {
  it.each(PRESETS)("%s is deterministic for a seed and has the requested size", (preset) => {
    const a = makeData(preset, 40, 123);
    expect(a).toHaveLength(40);
    expect(makeData(preset, 40, 123)).toEqual(a);
  });
  it("random is a permutation of 1..n", () => {
    const a = makeData("random", 50, 9);
    expect(
      sameMultiset(
        a,
        Array.from({ length: 50 }, (_, i) => i + 1),
      ),
    ).toBe(true);
  });
  it("reversed is strictly descending", () => {
    expect(makeData("reversed", 5, 0)).toEqual([5, 4, 3, 2, 1]);
  });
  it("few-unique uses at most 4 distinct values", () => {
    expect(new Set(makeData("few-unique", 64, 3)).size).toBeLessThanOrEqual(4);
  });
  it("different seeds differ for random", () => {
    expect(makeData("random", 30, 1)).not.toEqual(makeData("random", 30, 2));
  });
});

describe.each(ALGORITHMS)("%s", (algo) => {
  it("sorts and is a permutation, over many seeded inputs and presets", () => {
    for (const preset of PRESETS) {
      for (let seed = 0; seed < 25; seed++) {
        const size = 8 + (seed % 40);
        const input = makeData(preset, size, seed);
        const { sorted } = runSort(algo, input);
        expect(isSorted(sorted), `${algo}/${preset}/${seed}`).toBe(true);
        expect(sameMultiset(sorted, input)).toBe(true);
      }
    }
  });

  it("does not mutate its input", () => {
    const input = [5, 3, 4, 1, 2, 9, 8, 7];
    const copy = input.slice();
    runSort(algo, input);
    expect(input).toEqual(copy);
  });

  it("replaying the trace over the input reproduces the sorted output", () => {
    const input = makeData("random", 37, 5);
    const { trace, sorted } = runSort(algo, input);
    const a = input.slice();
    for (const op of trace) applyOp(a, op);
    expect(a).toEqual(sorted);
    expect(stateAt(input, trace, trace.length)).toEqual(sorted);
  });

  it("stepping one op at a time equals running to the end", () => {
    const input = makeData("random", 20, 11);
    const { trace } = runSort(algo, input);
    const stepped = input.slice();
    for (let k = 0; k < trace.length; k++) {
      applyOp(stepped, trace[k]);
      expect(stateAt(input, trace, k + 1)).toEqual(stepped);
    }
  });

  it("handles empty and single-element input", () => {
    expect(runSort(algo, []).sorted).toEqual([]);
    expect(runSort(algo, [1]).sorted).toEqual([1]);
    expect(runSort(algo, [1]).trace).toEqual([]);
  });

  it("handles duplicates", () => {
    expect(runSort(algo, [3, 1, 3, 1, 2, 2]).sorted).toEqual([1, 1, 2, 2, 3, 3]);
  });
});

describe("golden traces and counters (hand-verified)", () => {
  it("bubble on [3,2,1]: 3 comparisons, 3 swaps", () => {
    const { trace } = runSort("bubble", [3, 2, 1]);
    expect(trace).toEqual([
      { t: "cmp", i: 0, j: 1 },
      { t: "swap", i: 0, j: 1 },
      { t: "cmp", i: 1, j: 2 },
      { t: "swap", i: 1, j: 2 },
      { t: "cmp", i: 0, j: 1 },
      { t: "swap", i: 0, j: 1 },
    ]);
    expect(countOps(trace)).toEqual({ comparisons: 3, swaps: 3, writes: 0 });
  });

  it("insertion on already-sorted input is linear: n-1 comparisons, 0 swaps", () => {
    const { trace } = runSort("insertion", [1, 2, 3, 4, 5, 6]);
    expect(countOps(trace)).toEqual({ comparisons: 5, swaps: 0, writes: 0 });
  });

  it("insertion on reversed input of 4: 6 comparisons, 6 swaps", () => {
    const { trace } = runSort("insertion", [4, 3, 2, 1]);
    expect(countOps(trace)).toEqual({ comparisons: 6, swaps: 6, writes: 0 });
  });

  it("merge on [2,1]: one comparison, two writes, no swaps", () => {
    const { trace } = runSort("merge", [2, 1]);
    expect(countOps(trace)).toEqual({ comparisons: 1, swaps: 0, writes: 2 });
    expect(trace[trace.length - 1]).toEqual({ t: "set", i: 1, v: 2 });
  });

  it("merge on [3,1,2]: compares live-array positions, then copies back (hand-verified)", () => {
    // sort(0,1): cmp(0,1) takes 1, then 3 -> writes [1,3]. sort(0,2): cmp(0,2) takes 1,
    // cmp(1,2) takes 2, then 3 -> writes [1,2,3]. Compared indices always point at the
    // values actually compared because the live array is untouched until the copy-back.
    const { trace, sorted } = runSort("merge", [3, 1, 2]);
    expect(sorted).toEqual([1, 2, 3]);
    expect(trace).toEqual([
      { t: "cmp", i: 0, j: 1 },
      { t: "set", i: 0, v: 1 },
      { t: "set", i: 1, v: 3 },
      { t: "cmp", i: 0, j: 2 },
      { t: "cmp", i: 1, j: 2 },
      { t: "set", i: 0, v: 1 },
      { t: "set", i: 1, v: 2 },
      { t: "set", i: 2, v: 3 },
    ]);
  });

  it("quick on [3,1,2]: pivot is the last item (fixed rule)", () => {
    const { trace, sorted } = runSort("quick", [3, 1, 2]);
    expect(sorted).toEqual([1, 2, 3]);
    expect(trace[0]).toEqual({ t: "cmp", i: 0, j: 2 }); // compares a[0] with pivot a[2]
  });

  it("quick sort worst case is quadratic on sorted input; merge stays n log n", () => {
    const sortedInput = Array.from({ length: 64 }, (_, i) => i + 1);
    const q = countOps(runSort("quick", sortedInput).trace).comparisons;
    const m = countOps(runSort("merge", sortedInput).trace).comparisons;
    expect(q).toBe((64 * 63) / 2);
    expect(m).toBeLessThan(64 * Math.log2(64));
  });
});

describe("race", () => {
  const race = createRace(defaultArenaConfig);

  it("both lanes start from identical data and end sorted", () => {
    const start = laneAt(race, "left", 0);
    expect(start.array).toEqual(laneAt(race, "right", 0).array);
    expect(start.lastOp).toBeNull();
    expect(isSorted(laneAt(race, "left", race.length).array)).toBe(true);
    expect(isSorted(laneAt(race, "right", race.length).array)).toBe(true);
  });

  it("a lane that finishes early stays finished and keeps its counters", () => {
    const short = race.left.trace.length < race.right.trace.length ? "left" : "right";
    const len = race[short].trace.length;
    const atEnd = laneAt(race, short, len);
    const later = laneAt(race, short, race.length);
    expect(later.counters).toEqual(atEnd.counters);
    expect(later.done).toBe(true);
  });

  it("painted values override the preset", () => {
    const values = [8, 7, 6, 5, 4, 3, 2, 1];
    const r = createRace({ ...defaultArenaConfig, size: 8, values });
    expect(r.values).toEqual(values);
  });
});
