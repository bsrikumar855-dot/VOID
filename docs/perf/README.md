# Performance: how it is measured and the budgets

All numbers in this folder come from **real Lighthouse runs** (`lighthouse` is a pinned dev dependency, see `package.json`) against a production build served locally. They are not manual stopwatch measurements. Local runs on one machine are noisy: every result file shows the **median of several runs and the individual scores** so variance is visible. Compare only runs from the same machine, and treat differences smaller than the spread as noise.

## Reproduce

```bash
npm run build
npm run perf -- <label>        # writes docs/perf/<label>.md ; raw JSON in perf-results/ (gitignored)
npm run perf:budget            # fast, deterministic check of initial JavaScript per route
```

Environment variables: `PERF_RUNS` (default 3), `PERF_ROUTES` (comma list), `PERF_FORM_FACTORS` (`mobile`, `desktop`), `PERF_PORT` (default 3200), `CHROME_PATH` (defaults to Microsoft Edge on Windows). Lighthouse's mobile profile applies simulated slow-4G and 4x CPU throttling; desktop uses its desktop preset.

## Budgets (enforced or tracked)

| Budget | Value | Enforced by |
|---|---|---|
| Lighthouse performance (mobile and desktop) | >= 90 (spec target) | `npm run perf` (manual, not yet in CI) |
| Lighthouse accessibility | >= 95 (spec target) | `npm run perf` plus axe in Playwright (CI) |
| Lighthouse best practices / SEO | >= 95 | `npm run perf` |
| CLS | <= 0.1 | `npm run perf` |
| Mobile TBT (Lighthouse) | <= 200 ms | `npm run perf` |
| Initial JavaScript per route, gzip | <= 195 KB (no experiment), <= 225 KB (mounts an experiment); experiment routes are discovered from `src/experiments/*`, a missing build output fails | `npm run perf:budget` |
| JavaScript outside every checked route's initial load (lazy experiment views, other routes), gzip | <= 40 KB (measured 16.4) | `npm run perf:budget`; raise deliberately |
| Routes with no experiment have no schema library (Zod) on the critical path | must hold | `npm run perf:budget` and `tests/e2e/perf-budget.spec.ts` (Next may still prefetch experiment routes later; see ADR 0007) |
| No DevTools Issues (CSP violations etc.) | 0 | `tests/e2e/perf-budget.spec.ts`, `tests/e2e/experiments-contract.spec.ts` |

CI does **not** run Lighthouse yet (it is slow and noisy on shared runners); the budget script and the Playwright guards run in CI.

## Files

- `before.md`: baseline before the optimisation work (2026-11-08).
- `after-final-mobile.md`, `after-final-desktop.md`: the adopted configuration (5 mobile runs, 3 desktop runs per route).
- `three-experiments-mobile.md`, `three-experiments-desktop.md`: the current numbers, final build with three experiments (5 mobile / 3 desktop runs per route). `two-experiments-*.md` and `after-final-*.md` are earlier states kept as evidence.
- The Glitch Lab regression (mobile 95, blocking time 252 ms, then fixed to 100 and 78 ms) is documented in ADR 0009; its pre-fix per-route file was not kept.
- `after-all-changes.md`, `ab-no-inlinecss.md`: rejected variants kept as evidence.
- The decision record with the comparison tables and the honest reading: `docs/decisions/0007-performance-audit-and-optimisation.md`.
