# Contributing to VOID

VOID is open source (Apache-2.0). The easiest meaningful contribution is a new experiment. This guide describes the structure as it exists today; if something here is wrong, fix the guide in the same pull request.

## Ground rules

- **Real, not decorative.** Visuals must show what the code actually computes. No fake numbers, activity, users or AI output. Simulated data is labelled as simulated; demo output is never presented as real AI.
- **Tested.** A new experiment ships with unit tests for its core and has its contract tests pass.
- **Accessible.** Keyboard operable, visible focus, text alternatives for canvases, `prefers-reduced-motion` respected, WCAG 2.1 AA contrast.
- **Small.** No new dependency without a named job (see `docs/decisions/0002-*.md`).

## Run it

```bash
npm install
npm run dev            # http://localhost:3000
npm run check          # typecheck, lint, unit tests, build, end-to-end tests (CI also runs `npm run format:check`)
```

End-to-end tests drive Microsoft Edge locally (no download). In CI they use Chromium via `npx playwright install --with-deps chromium`.

## Add an experiment

An experiment lives in its own folder and may import only from `@/engine/public` (enforced by ESLint; `tests/integration/lint-boundaries.test.ts` proves the rules fire).

```
src/experiments/<slug>/
  manifest.ts     defineExperiment({ meta, configSchema, defaultConfig, examples? }): server-safe, never references view/
  limits.ts       numeric limits/constants and the default config: NO runtime imports (see "Keep Zod out of the view")
  config.ts       strict Zod schema (imports limits.ts); the seed (if any) is part of the config
  core/           pure, deterministic logic: no DOM, no React, no clocks, no Math.random
  view/mount.tsx  "use client"; default-exports an ExperimentModule { mount(host, options) }. The host loads it BY CONVENTION
                  (experiments/<slug>/view/mount), so it is its own lazy chunk and server pages never reference it
```

1. Copy `src/experiments/algorithm-arena/` as a starting point and rename it.
2. Define `config.ts` with `z.strictObject(...)`: bounded integers, array length caps, a seed. Shared links are untrusted input; the schema is the gate. Put every constant the view needs in `limits.ts` instead (next section).
3. Put the logic in `core/` and test it in `tests/unit/` (property tests plus hand-verified golden values; stepping must equal running to the end).
4. In `view/mount.tsx` (mark it `"use client"`: server pages import the registry, and the module uses `react-dom/client`; wrap your root in `ExperimentErrorBoundary` from `@/engine/public`), return an `ExperimentHandle` (`play`, `pause`, `reset`, `step`, `setConfig`, `destroy`). `destroy()` must be idempotent and release timers, listeners and animation frames. Visible state should be a pure function of `(config, step)`.
5. Add an import and one entry to `src/registry/index.ts`. Explore, the homepage example links and `/experiments/<slug>` derive from the registry (the first entry is the homepage hero); do not keep another list.
6. If you add `examples`, every `note` is shown as fact, so test that it is true (see `tests/unit/arena-examples.test.ts`).
7. Run `npm run check`.

### Keep Zod out of the view

The view (anything under `view/`, plus `core/`) must not import from `config.ts` at runtime: that file builds the Zod schema, so importing a constant from it ships the whole schema library to every page that can reach your view. Import constants from `limits.ts` and use `import type` for types. `npm run perf:budget` fails if a route with no experiment (`/explore`) ships Zod, and each route has an initial-JavaScript budget.

### If your experiment starts expensive work (WebGL, big arrays, workers)

Opening an experiment must not block the page. Glitch Lab's first version did its setup in one block and cost about 170 ms of extra mobile blocking time (Lighthouse 95, ADR 0009). Wait for the first paint (`requestAnimationFrame` then `setTimeout`) before creating contexts, build large buffers cheaply (copy repeated rows instead of computing every pixel, allocate nothing per pixel), and link WebGL programs with `KHR_parallel_shader_compile` rather than reading link status immediately. Tie the resource to its element with a ref callback that returns a cleanup function, and release GPU contexts in it. Offer a fallback when the capability is missing and say on the page which path is running. Anything that animates must be opt-in, with a warning if it can flicker.

### Shared building blocks come from the engine

Experiments may not import each other. If two experiments need the same primitive, it moves into `src/engine` and is exported from `@/engine/public`. Today that is the seeded PRNG `mulberry32` (never use `Math.random` in a core), `defineExperiment`, `ExperimentErrorBoundary` and the types.

## The contract, as enforced

You add: your folder, one import and one entry in `src/registry/index.ts`, your own tests. You do not edit any other experiment, the engine, the homepage, Explore or navigation. These checks run for you automatically:

| Check             | Where                                                  | What it proves                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registry contract | `tests/unit/registry-contract.test.ts`                 | folder is registered, unique id/slug, URL-safe slug, metadata complete, default config valid and round-trips through the share codec, every example valid and round-trips, loader resolves to `mount()`                                                                                                                                                                                                                                                                                            |
| Import boundaries | ESLint + `tests/integration/lint-boundaries.test.ts`   | experiments import only `@/engine/public` (alias or relative), never each other, never the app shell or registry; `core/` has no React, DOM, clocks, timers or `Math.random`                                                                                                                                                                                                                                                                                                                       |
| Browser contract  | `tests/e2e/experiments-contract.spec.ts`               | for every experiment: loads with defaults without console errors or DevTools issues; the written share link decodes to the defaults; each curated example opens that exact configuration in a fresh browser; hostile links (garbage, wrong prefix, other experiment, newer version, invalid config with `__proto__`) show a notice and load defaults; skip-link does not disturb the state; axe has no serious/critical violations in dark and light; no horizontal scroll; leave-and-return works |
| Derived surfaces  | same file                                              | Explore lists exactly the registry; the homepage lists exactly every example of every experiment; the hero is the first entry                                                                                                                                                                                                                                                                                                                                                                      |
| Bundle budget     | `npm run perf:budget`, `tests/e2e/perf-budget.spec.ts` | initial JavaScript per route within budget; no Zod on `/explore`                                                                                                                                                                                                                                                                                                                                                                                                                                   |

What is **not** automated: whether your experiment is any good, your own core's correctness (write those tests), and screen-reader behaviour.

## Share links

A link carries versioned configuration in the URL fragment (`#1j.<base64url JSON>`), never internal state. Decoding is a validation pipeline that cannot throw or half-apply; invalid links fall back to defaults with a visible notice. If you change a config schema incompatibly, bump `meta.version`.

## Design

Read `docs/design-system.md` (and ADR 0005). In short: dark instrument-like surfaces, Geist Sans for the interface, Geist Mono only for data, no decorative glows, no identical card grids, no fake statistics, no eyebrow labels above headings.

## Pull requests

Describe what you verified and how. Say plainly what you did not test. Security-sensitive changes (anything that fetches URLs, runs user code, handles accounts or model output) need a note on the threat considered; see `docs/security.md`.
