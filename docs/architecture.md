# VOID — Architecture (planning draft)

Source: master spec §6, §13–§15, §17, §22. Status: **draft for review by `/plan-eng-review`; no code exists.** Versions below are *intentions*; exact versions are verified against the registry at M1 and recorded in `docs/decisions/`.

## 1. Principles

1. The **experiment engine** is the single abstraction. Experiments are plugins registered against it, never standalone pages with duplicated logic (§6).
2. **Pure core, thin shell.** Each experiment's logic (math, algorithms, simulations) is a framework-free, deterministic, unit-testable module. Rendering (Canvas/WebGL/SVG) and React are adapters over that core. This is what makes "visualization reflects actual state" and "tests verify the math" achievable.
3. **Server Components by default**; Client Components only for interaction. Heavy visuals are dynamically imported and mounted only when visible/needed (§13, §17).
4. **No fake data.** Anything shown as live/trending/community comes from real stored data or is absent. Before data exists, sections show honest empty states or are omitted from the page (§11 rules 8–10).
5. **Minimal dependencies** (§11 rule 19). Add a library only when its job is named.
6. Security boundaries are explicit (see `security.md`); authorization is enforced server-side and in RLS, never by the client alone.

## 2. Stack (per §13) and open version questions

| Layer | Choice | Note |
|---|---|---|
| Framework | Next.js (App Router), React, TypeScript `strict` | Confirm current stable + Node 24 compatibility at M1 |
| Styling | Tailwind CSS, shadcn/ui as unstyled primitives only | Heavily re-themed; no library-default look (§11) |
| Graphics | Canvas 2D for most experiments; Three.js + React Three Fiber for the hero/Glitch Lab where 3D earns its cost; D3 for graph layout/scales only | **Review item:** avoid shipping Three + GSAP + Motion + D3 to the homepage. Lazy-load per route. |
| Motion | Motion for UI state transitions; GSAP only if timeline choreography needs it | **Review item:** overlapping animation libs conflict with "avoid dependency duplication" (§13). Decide in ADR. |
| Backend | Supabase (Postgres, Auth, Storage) + Next.js Route Handlers | Introduced at M7; M1–M6 must work with no backend |
| Validation | Zod (shared by config schemas, API inputs, shared URLs) | |
| Forms/state | React Hook Form where forms exist; Zustand only where justified | |
| Tests | Vitest (unit/integration), Playwright (e2e), `tsc`, ESLint, Prettier | |
| Deploy | Vercel + Supabase + GitHub Actions + Sentry-or-equivalent | **Not performed without authorization (§22)** |

## 3. Repository layout

Follows §14 but only creates directories when they contain real code. Initial (M1–M3): `src/app`, `src/components/{ui,layout,navigation,terminal,visualization,shared}`, `src/features/experiments` (engine), `src/lib/{validation,security,utils}`, `src/config`, `tests/{unit,integration,e2e}`, `docs/`. Feature folders (`neural-network`, `algorithms`, …) appear with their milestone. `supabase/` appears at M7.

## 4. Experiment engine design

```
ExperimentManifest  { id, slug, title, description, category, tags[], pillars[], version,
                      configSchema (Zod), defaultConfig, load: () => Promise<ExperimentModule> }
ExperimentModule    { create(config, ctx) -> ExperimentInstance }
ExperimentInstance  { init(), run(), pause(), resume(), reset(), cleanup(),
                      serialize() -> StateEnvelope, restore(StateEnvelope), on(event) }
StateEnvelope       { experimentId, schemaVersion, config, state?, seed? }
Registry            register(manifest) · get(slug) · list(filter) · search(query)
Lifecycle           REGISTERED → LOADED → INITIALIZED → RUNNING ⇄ PAUSED → (RESET) → CLEANED_UP   (+ ERROR)
```

- **Lifecycle is an explicit state machine** with illegal transitions rejected and unit-tested.
- **Resource management:** instance receives a `ctx` with `onCleanup(fn)`, `raf`, `worker(url)` and `timer` helpers that auto-dispose on `cleanup()`; leaks are caught in tests.
- **Determinism:** `ctx.rng(seed)` seeded PRNG; simulations take a seed so shared URLs reproduce runs.
- **Serialization:** `StateEnvelope` is Zod-validated on restore; unknown `schemaVersion` triggers a migration function or a clear error (never a crash).
- **Isolation:** one instance per mount; no shared mutable module state; error boundary per experiment.
- **Performance measurement:** `ctx.perf` records init time, frame time, step time; surfaced in a dev overlay, not as marketing numbers.
- **Share URLs:** `/experiments/[slug]?c=<base64url(compressed config)>` for ephemeral sharing (works with no backend); saved/published versions use `/experiments/[slug]/v/<id>` after M7.

## 5. Data model (M7+) — from §15

Tables: profiles, experiments, experiment_versions, experiment_configurations, experiment_runs, categories, tags, bookmarks, likes, comments, remixes, challenges, challenge_submissions, reports, notifications. Core relations: `experiments.owner_id → profiles`, `experiment_versions.experiment_id`, `remixes(parent_version_id, child_experiment_id)`. Visibility enum `public|unlisted|private`. RLS per `security.md`. Detailed DDL is written in the M7 plan, not before.

## 6. Performance strategy (targets, not achievements — §17)

- Homepage ships HTML/CSS first; hero visual is a lazy island that mounts after first paint and only when the device qualifies (reduced-motion off, WebGL available, not low-power). Otherwise a static/SVG/canvas-light fallback renders.
- Per-route code splitting; each experiment is a dynamic import; Web Workers for CPU-heavy sims (training loops, large graphs).
- Budgets to be set at M1 (JS per route, LCP, CLS, INP) and enforced by measured checks; Lighthouse 90+ perf / 95+ a11y are **targets** until measured on representative routes.
- All rAF loops, GL contexts, listeners and workers disposed on cleanup.

## 7. Terminal architecture

Command registry (`name`, `args schema`, `run(ctx)`, `suggest()`), consumed by the UI. Commands call real app functions: router navigation, theme store, experiment registry search. Contextual commands depend on the current route/experiment. History persisted locally. Opens with a keyboard shortcut and is fully keyboard/screen-reader operable.

## 8. Theme infrastructure

Semantic CSS-variable tokens (see `design-system.md`); `theme dark|light` is a real command and a real toggle. Spec palette is dark-first; a light theme must be designed, not auto-inverted — decision recorded in an ADR before it ships.

## 9. Risks (carry into `/plan-eng-review`)

1. Scope: the spec describes years of work; milestones must each ship something complete, not scaffolds.
2. Backend-less until M7: engine and shareable URLs must not depend on Supabase.
3. WebGL cost vs "performant and readable" hero; needs device-aware fallback.
4. Library overlap (GSAP vs Motion; Three vs Canvas vs D3).
5. Agent Arena needs provider keys/budget the owner hasn't specified; demo mode must be honest.
6. Next.js/React/Tailwind latest majors may have compatibility edges with shadcn/R3F; verify at M1.
