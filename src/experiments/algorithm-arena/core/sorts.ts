/**
 * Sorting algorithms that RECORD what they do as an operation trace.
 * The renderer and the counters are both derived from the trace, so what is
 * drawn is the algorithm's actual behaviour by construction (spec §4.5).
 *
 * Pure: no DOM, no React, no clocks, no randomness. Pivot rule is fixed.
 */

export type Op =
  | { t: "cmp"; i: number; j: number } // compared a[i] with a[j]
  | { t: "swap"; i: number; j: number } // swapped a[i] and a[j]
  | { t: "set"; i: number; v: number }; // wrote value v into a[i]

export const ALGORITHMS = ["bubble", "insertion", "merge", "quick"] as const;
export type AlgorithmId = (typeof ALGORITHMS)[number];

export const ALGORITHM_INFO: Record<
  AlgorithmId,
  { name: string; best: string; average: string; worst: string; note: string }
> = {
  bubble: {
    name: "Bubble sort",
    best: "O(n²)",
    average: "O(n²)",
    worst: "O(n²)",
    note: "Repeatedly swaps adjacent out-of-order pairs. This version has no early exit, so it does the same comparisons on any input.",
  },
  insertion: {
    name: "Insertion sort",
    best: "O(n)",
    average: "O(n²)",
    worst: "O(n²)",
    note: "Grows a sorted prefix by sliding each new item left. Very fast on nearly sorted data.",
  },
  merge: {
    name: "Merge sort",
    best: "O(n log n)",
    average: "O(n log n)",
    worst: "O(n log n)",
    note: "Splits in half, sorts each half, then merges. Uses extra space: each merged item is copied back as a write. A bracket marks the two items at the front of the runs being merged.",
  },
  quick: {
    name: "Quick sort",
    best: "O(n log n)",
    average: "O(n log n)",
    worst: "O(n²)",
    note: "Partitions around a pivot (always the last item here, so reversed or sorted input is its worst case).",
  },
};

export interface SortResult {
  trace: Op[];
  sorted: number[];
}

type Tracer = (op: Op) => void;

function bubble(a: number[], emit: Tracer): void {
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      emit({ t: "cmp", i: j, j: j + 1 });
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        emit({ t: "swap", i: j, j: j + 1 });
      }
    }
  }
}

function insertion(a: number[], emit: Tracer): void {
  for (let i = 1; i < a.length; i++) {
    let j = i;
    while (j > 0) {
      emit({ t: "cmp", i: j - 1, j });
      if (a[j - 1] > a[j]) {
        [a[j - 1], a[j]] = [a[j], a[j - 1]];
        emit({ t: "swap", i: j - 1, j });
        j--;
      } else {
        break;
      }
    }
  }
}

function merge(a: number[], emit: Tracer): void {
  const sort = (lo: number, hi: number): void => {
    if (hi - lo < 1) return;
    const mid = (lo + hi) >> 1;
    sort(lo, mid);
    sort(mid + 1, hi);
    // Merge into a temporary output while the live array is untouched, so every compared
    // index points at the value actually compared. Then copy back, one traced write each.
    const out: number[] = [];
    let i = lo;
    let j = mid + 1;
    while (i <= mid && j <= hi) {
      emit({ t: "cmp", i, j });
      if (a[j] < a[i]) out.push(a[j++]);
      else out.push(a[i++]);
    }
    while (i <= mid) out.push(a[i++]);
    while (j <= hi) out.push(a[j++]);
    for (let k = 0; k < out.length; k++) {
      a[lo + k] = out[k];
      emit({ t: "set", i: lo + k, v: out[k] });
    }
  };
  sort(0, a.length - 1);
}

function quick(a: number[], emit: Tracer): void {
  const sort = (lo: number, hi: number): void => {
    if (lo >= hi) return;
    // Lomuto partition, pivot = a[hi] (fixed rule: deterministic, worst on sorted input).
    let store = lo;
    for (let j = lo; j < hi; j++) {
      emit({ t: "cmp", i: j, j: hi });
      if (a[j] < a[hi]) {
        if (store !== j) {
          [a[store], a[j]] = [a[j], a[store]];
          emit({ t: "swap", i: store, j });
        }
        store++;
      }
    }
    if (store !== hi) {
      [a[store], a[hi]] = [a[hi], a[store]];
      emit({ t: "swap", i: store, j: hi });
    }
    sort(lo, store - 1);
    sort(store + 1, hi);
  };
  sort(0, a.length - 1);
}

const IMPLEMENTATIONS: Record<AlgorithmId, (a: number[], emit: Tracer) => void> = {
  bubble,
  insertion,
  merge,
  quick,
};

/** Run an algorithm on a copy of `values`, returning its full operation trace. */
export function runSort(algorithm: AlgorithmId, values: readonly number[]): SortResult {
  const work = values.slice();
  const trace: Op[] = [];
  IMPLEMENTATIONS[algorithm](work, (op) => trace.push(op));
  return { trace, sorted: work };
}

/** Apply one traced operation to an array (used to replay a trace). */
export function applyOp(a: number[], op: Op): void {
  if (op.t === "swap") [a[op.i], a[op.j]] = [a[op.j], a[op.i]];
  else if (op.t === "set") a[op.i] = op.v;
}

export interface Counters {
  comparisons: number;
  swaps: number;
  writes: number;
}

export function countOps(trace: readonly Op[], upTo: number = trace.length): Counters {
  const c: Counters = { comparisons: 0, swaps: 0, writes: 0 };
  const end = Math.min(upTo, trace.length);
  for (let k = 0; k < end; k++) {
    const t = trace[k].t;
    if (t === "cmp") c.comparisons++;
    else if (t === "swap") c.swaps++;
    else c.writes++;
  }
  return c;
}

/** Array state after the first `step` operations: a pure function of (values, trace, step). */
export function stateAt(values: readonly number[], trace: readonly Op[], step: number): number[] {
  const a = values.slice();
  const end = Math.min(step, trace.length);
  for (let k = 0; k < end; k++) applyOp(a, trace[k]);
  return a;
}
