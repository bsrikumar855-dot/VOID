import { describe, expect, it } from "vitest";
import { createRace } from "@/experiments/algorithm-arena/core/sim";
import { countOps } from "@/experiments/algorithm-arena/core/sorts";
import { algorithmArena } from "@/experiments/algorithm-arena/manifest";

/**
 * The homepage shows each example's note as fact, so each claim is checked
 * against the real operation counts here. If a note stops being true, this fails.
 */
const examples = algorithmArena.examples ?? [];
const ops = (cfg: (typeof examples)[number]["config"]) => {
  const race = createRace(cfg);
  return {
    left: countOps(race.left.trace),
    right: countOps(race.right.trace),
    leftTotal: race.left.trace.length,
    rightTotal: race.right.trace.length,
  };
};

describe("Arena curated examples", () => {
  it("has the three documented examples, all valid", () => {
    expect(examples.map((e) => e.title)).toEqual([
      "When quick sort is not quick",
      "Nearly sorted data",
      "Only four distinct values",
    ]);
    for (const e of examples)
      expect(algorithmArena.configSchema.safeParse(e.config).success).toBe(true);
  });

  it("quick sort on reversed input does far more comparisons than merge sort (claim 1)", () => {
    const r = ops(examples[0].config);
    expect(r.left.comparisons).toBe((64 * 63) / 2); // 2016, quadratic
    expect(r.left.comparisons).toBeGreaterThan(r.right.comparisons * 3);
  });

  it("insertion sort does a fraction of bubble sort's operations on nearly sorted data (claim 2)", () => {
    const r = ops(examples[1].config);
    expect(r.leftTotal).toBeLessThan(r.rightTotal / 3);
  });

  it("quick sort does more comparisons than merge sort on few unique values (claim 3)", () => {
    const r = ops(examples[2].config);
    expect(r.left.comparisons).toBeGreaterThan(r.right.comparisons);
  });
});
