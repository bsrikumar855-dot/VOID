# 0007 — Performance audit and optimisation (Phase 1 of the second cycle)

- Date: 2026-11-08
- Status: Accepted
- Evidence: `docs/perf/before.md`, `after-final-mobile.md`, `after-final-desktop.md`, and the rejected variants `after-all-changes.md`, `ab-no-inlinecss.md`. Raw per-run JSON is in `perf-results/` (gitignored); regenerate with `npm run perf`.

## Method and limits

Lighthouse 13.6.0 (exact-pinned dev dependency), Microsoft Edge, production build via `next start` on localhost, Lighthouse's own mobile throttling (simulated slow 4G + 4x CPU) and desktop preset. Medians of 3 to 5 runs, with the individual runs shown. **One machine** (AMD Ryzen 7 4800H, 15 GB), localhost (no real network), Edge not Chrome, not run in CI. Differences smaller than the run-to-run spread (about 20-40 ms on blocking time, one-point on score) are noise. Earlier Playwright "vitals" numbers in `implementation-status.md` were not Lighthouse and are superseded by this document.

## Baseline

Every route already met the spec targets: Lighthouse performance 99 to 100, accessibility 100, SEO 100, desktop blocking time 0 ms, mobile blocking time 68 to 113 ms. Best-practices was 96 on `/` and the Arena page (100 on `/explore`). The 181 KB figure came from the earlier probe; by my gzip estimate of the scripts each page's HTML references, every route was about 212 to 214 KB.

## Findings

1. **Framework floor (~150 KB gzip of the ~182 KB on a plain route):** React DOM 63.8 KB, Next client runtime 44.6 KB plus another 38.7 KB shared. Not reducible by us.
2. **Zod (~30 KB gzip) reached every route.** The Arena's client view imported size constants from `config.ts`, the same file that builds the Zod schema, so the view's chunk carried the schema library; and a `"use client"` module reachable from the registry is attached to every page that imports the registry (including `/explore`). Lighthouse flagged that chunk as 77% unused.
3. **A hidden CSP violation on every page that loaded Zod** (Lighthouse "inspector-issues", best-practices 96). Zod 4 probes `new Function` to JIT schemas; our CSP forbids eval; Zod swallows the throw but Chrome logs a `kEvalViolation`. Zod reads its `jitless` flag **when each schema is constructed**, so the setting must run before any schema exists.
4. Smaller items, not fixed: 15 KB "legacy JavaScript" is Next's own polyfill chunk (`Array.prototype.at/flat/flatMap`, `Object.fromEntries`); ~7 KB render-blocking stylesheet (about 100 ms simulated on mobile); React DOM's own 37% unused code; desktop CLS 0.057 on the Arena page (below the 0.1 "good" bound; the 32rem loading placeholder is not the final height).

## Decisions

### Kept
- **`limits.ts` per experiment: constants and defaults in a module with no runtime imports; the view and core import from it and use `import type` for config types.** Documented as a rule in CONTRIBUTING.md and enforced by the bundle budget.
- **`src/engine/zod-config.ts`** (`z.config({ jitless: true })`), imported first by the registry and by the share codec. Configs are tiny, so no measurable cost.
- **`npm run perf:budget`** (initial JS per route; routes with no experiment must not reference Zod) and Playwright guards (no DevTools Issues; initial scripts of `/explore` free of Zod).
- **Reproducible audit tooling** (`npm run perf`, `docs/perf/README.md`).

### Tried and rejected, with evidence
| Variant | Mobile `/` TBT per run | First paint | Verdict |
|---|---|---|---|
| Baseline | 96 / 75 / 94 | 770-792 ms | reference |
| `experimental.inlineCss` + lazy host + limits + jitless | 185 / 322 / 345 | 848-947 ms | **Rejected: regression.** Turning `inlineCss` off alone restored first paint to 771-788 ms. |
| Lazy registry/codec import in the host (inlineCss off) | 207 / 110 / 90 / 139 / 140 | 771-788 ms | **Rejected:** helps `/explore` (blocking time 35-52 ms) but experiment pages became interactive ~400 ms later (TTI 3260-3460 vs 2850-2920 ms) because registry chunk then view chunk load serially. |
| **Final: static host + limits + jitless, no inlineCss** | 245 / 65 / 53 / 94 / 51 | 764-825 ms | **Adopted.** |

### Final results (medians; `docs/perf/after-final-*.md`)

| Form | Route | Perf before → after | TBT before → after | FCP/LCP before → after | Best-practices |
|---|---|---|---|---|---|
| mobile | `/` | 99 → **100** | 94 → **65 ms** | 775 → **768 ms** | 96 → **100** |
| mobile | `/explore` | 100 → 100 | 68 → 83 ms | 772 → **763 ms** | 100 → 100 |
| mobile | `/experiments/algorithm-arena` | 99 → 99 | 113 → **101 ms** | 773 → **766 ms** | 96 → **100** |
| desktop | all three | 100 → 100 | 0 → 0 ms | 217-221 → 217-222 ms | 96/100/96 → **100** |

Honest reading: the user-visible performance change is small because the starting point was already excellent. The clear wins are best-practices 96 → 100 (the CSP violation), `/explore` time to interactive (about 2,830 → 2,555 ms), and an initial-JavaScript reduction on `/explore` (about 212 → 182 KB by my estimate). Mobile blocking time on `/explore` moved 68 → 83 ms, which is within the run spread (before: 56/122/68; after: 99/83/87/83/77). `/` had one slow run (245 ms) in five.

### A correction to an earlier statement
I told the owner `/explore` "no longer downloads Zod". That is true of the **HTML-referenced (critical-path) scripts** only. Lighthouse's total transfer for `/explore` is unchanged (284 KB vs 282 KB) and its "unused JavaScript" is still ~60 KB, because Next **prefetches** the experiment routes that Explore links to, which pulls in the Zod-bearing chunks. The prefetch is deliberate Next behaviour that makes the likely next click instant, so it stays; the guard test was corrected to assert the critical path, not the whole network.

## Budgets (see `docs/perf/README.md`)

Lighthouse performance and accessibility targets stay at the spec values (90 / 95) and are met with margin. New enforced budgets: initial JS per route <= 195 KB gzip for routes with no experiment and <= 225 KB for routes that mount one (measured 182 and 214), and no Zod on `/explore`'s critical path. Lighthouse itself is **not yet in CI**.

## Open

Next's 15 KB polyfill chunk; React DOM's unused code; the 7 KB render-blocking CSS (inlining regressed, so left alone); Arena desktop CLS 0.057; Lighthouse in CI; real-network and real-device measurement; Firefox/Safari performance; whether `prefetch={false}` on Explore's links is worth the slower first navigation.
