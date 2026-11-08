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
npm run check          # typecheck, lint, unit tests, build, end-to-end tests
```

End-to-end tests drive Microsoft Edge locally (no download). In CI they use Chromium via `npx playwright install --with-deps chromium`.

## Add an experiment

An experiment lives in its own folder and may import only from `@/engine/public` (enforced by ESLint; `tests/integration/lint-boundaries.test.ts` proves the rules fire).

```
src/experiments/<slug>/
  manifest.ts     defineExperiment({ meta, configSchema, defaultConfig, examples?, load })
  config.ts       strict Zod schema; the seed (if any) is part of the config
  core/           pure, deterministic logic: no DOM, no React, no clocks, no Math.random
  view/           React/Canvas; exports an ExperimentModule with mount(host, options)
```

1. Copy `src/experiments/algorithm-arena/` as a starting point and rename it.
2. Define `config.ts` with `z.strictObject(...)`: bounded integers, array length caps, a seed. Shared links are untrusted input; the schema is the gate.
3. Put the logic in `core/` and test it in `tests/unit/` (property tests plus hand-verified golden values; stepping must equal running to the end).
4. In `view/mount.tsx`, return an `ExperimentHandle` (`play`, `pause`, `reset`, `step`, `setConfig`, `destroy`). `destroy()` must be idempotent and release timers, listeners and animation frames. Visible state should be a pure function of `(config, step)`.
5. Add **one line** to `src/registry/index.ts`. Home, Explore and navigation derive from the registry; do not keep another list.
6. If you add `examples`, every `note` is shown as fact, so test that it is true (see `tests/unit/arena-examples.test.ts`).
7. Run `npm run check`.

The registry contract test (`tests/unit/registry-contract.test.ts`) automatically checks your experiment: unique slug, valid default config, share-link round trip, loader resolves.

## Share links

A link carries versioned configuration in the URL fragment (`#1j.<base64url JSON>`), never internal state. Decoding is a validation pipeline that cannot throw or half-apply; invalid links fall back to defaults with a visible notice. If you change a config schema incompatibly, bump `meta.version`.

## Design

Read `docs/design-system.md` (and ADR 0005). In short: dark instrument-like surfaces, Geist Sans for the interface, Geist Mono only for data, no decorative glows, no identical card grids, no fake statistics, no eyebrow labels above headings.

## Pull requests

Describe what you verified and how. Say plainly what you did not test. Security-sensitive changes (anything that fetches URLs, runs user code, handles accounts or model output) need a note on the threat considered; see `docs/security.md`.
