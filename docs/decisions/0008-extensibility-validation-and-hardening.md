# 0008 — Extensibility validation (Phase 2), Experiment #2 (Phase 3) and hardening (Phase 4)

- Date: 2026-11-08
- Status: Accepted
- Amends: ADR 0002 D1 and D6 (the `load()` member of the engine contract is removed; views load by convention).

## Phase 2: does the architecture really let you add an experiment by adding a folder?

**Test performed:** build the Neural Network Playground as experiment #2 without touching the Arena's implementation, then examine what had to change.

**What had to change outside `src/experiments/neural-network/`:**

| File | Change | Why |
|---|---|---|
| `src/registry/index.ts` | one import + one array entry | the single list (intended) |
| `src/engine/rng.ts`, `src/engine/public.ts` | export the seeded PRNG | experiments may not import each other, so the primitive both need moved to the engine (separate commit, before the experiment) |
| `src/app/not-found.tsx` | copy no longer names a specific experiment | the new isolation scan found a hard-coded experiment URL: a second hand-synced list |
| `src/engine/types.ts`, both manifests, `experiment-host.tsx` | see below | a scalability defect that only a second experiment could reveal |
| tests, docs | new generic suites | see below |

**Finding 1 (fixed): the registry's lazy boundary leaked.** A manifest's `load: () => import("./view/mount")` made every server page that imports the registry carry every experiment's view chunks (`/explore` went 181.9 → 187.4 KB when experiment #2 was added). Fix: manifests no longer have `load`; the client host loads `experiments/<slug>/view/mount` by naming convention, so server pages never reference views. Measured with the production build: `/explore` 175.7 KB with two experiments and **175.7 KB with three** (a temporary third experiment, removed afterwards); the homepage grew 0.2 KB (the third experiment's metadata only). A unit test asserts a manifest never references its view.

**Finding 2 (fixed): an experiment's first draft was invalid under its own rules.** The registry contract test caught a curated example outside the schema's parameter limits before it shipped.

**Finding 3 (fixed): Chrome's Issues panel flagged unnamed form fields** on the new experiment; every control now has a `name`. A generic browser test asserts zero DevTools Issues for every registered experiment.

**Finding 4 (fixed): the first mobile layout was unusable.** The 720-unit diagram scaled to ~10 px neurons at 360 px; a first fix made the whole page overflow sideways (caught by looking at the screenshot and by the generic "no horizontal scroll" test). Final: the diagram keeps a readable size inside a focusable, labelled horizontal scroll region, with a visible hint; grid columns have `min-w-0`.

**What the contract now is, and how it is enforced:** documented in CONTRIBUTING.md ("The contract, as enforced"): unit registry contract, ESLint boundaries (alias and relative imports), an independent import-scan isolation test, a generic Playwright contract run for every registered experiment (loading, share-link round trip in a fresh browser, curated examples, five hostile-link classes, skip-link, axe in both themes, overflow, lifecycle, DevTools Issues), derived-surface tests (Explore, homepage examples, hero = first registry entry), and the bundle budget.

**Honest limits of the validation:** two experiments is a small sample; both are React + Canvas/SVG on the main thread. Nothing here tests a WebGL experiment, a Web Worker experiment, or a server-backed one. The Arena still carries its own copy of the PRNG (deduplicating would modify an unrelated experiment; recorded as a follow-up). The temporary third experiment proved the bundle property but was a copy of the second, not an independent experiment.

## Phase 3: Experiment #2, scope as built

Built: network of 1-3 inputs and 1-4 layers of 1-6 neurons; weights and biases editable per neuron (±5, integer-scaled by 100 in share links); linear, ReLU, sigmoid, tanh; forward propagation with a plain-language explanation of each neuron's real arithmetic; live values in the diagram (dashed = negative, text values, not colour alone); input sliders and binary presets; prediction text (probability reading for a single sigmoid output, argmax otherwise); step, run, replay, reset, compute-all; table view; three tested curated examples; a hand-built XOR network as the default. Core maths verified by hand and against an independent Python implementation, plus a 300-network property test against a second flat-index evaluator.

**Not built:** training (spec §4.1 lists "training visualization"; the owner's Phase 3 list did not), backpropagation, datasets, decision-boundary plots, more than 3 inputs. The UI says plainly that no training happens.

**Numerics note:** sigmoid and tanh use `Math.exp`, which may differ in the last bit between JavaScript engines; the display rounds to 3 decimals and tests use explicit tolerances.

## Phase 4: hardening

| Item | State |
|---|---|
| Actions pinned to commit SHAs | **Done in the workflow files** (`actions/checkout` v4.4.0 `11d5960a…`, `actions/setup-node` v4.4.0 `49933ea5…`, `github/codeql-action` v3.39.3 `9418214d…`, from `git ls-remote --tags` on 2026-11-08). Not independently verified beyond that lookup. Dependabot's `github-actions` ecosystem proposes updates. |
| CodeQL | **Workflow added** (`.github/workflows/codeql.yml`: push, PR, weekly). **Has not run**: it first runs when the commits are pushed. |
| Secret scanning | **Pattern scanner added** (`npm run security:secrets`, runs first in CI, with unit tests for 9 credential shapes and forbidden files; finds nothing in tracked files). It is a pattern scan of the working tree, not a gitleaks replacement and not a history scan. **Owner action still needed:** enable GitHub secret scanning and push protection in the repository settings (cannot be done from code). |
| CSP review | **Unchanged on purpose.** Re-reading ADR 0004 against the shipped headers: script-src/style-src still need `'unsafe-inline'` because Next's inline bootstrap scripts cannot be hashed without its experimental SRI mode, and the theme-init script is inline. No `unsafe-eval` in production (asserted on four routes); `blob:` removed; Zod's eval probe removed (ADR 0007). Considered and not added: `Cross-Origin-Resource-Policy` (unverified interaction with crawlers/previews) and `upgrade-insecure-requests`/HSTS (host's job, and `upgrade-insecure-requests` would break local http testing). Revisit before M7 as ADR 0004 says. |
| GitHub CI verification | **Not verified.** The workflow has never run. The repository is public, so its run status can be read without credentials after the first push. |
| Chrome / Edge | Edge: full suite passes (192 browser tests). Chrome: see implementation-status.md for the result of the run. |
| Firefox | **Not tested.** Firefox is not installed; Playwright's Firefox build would have to be downloaded (not done without approval). |
| Screen-reader testing | **Not performed.** No screen reader is available to me. `docs/a11y/screen-reader-checklist.md` is the script and the results table for a human tester. |

## Follow-ups

Deduplicate the Arena's PRNG through the engine; Firefox and WebKit runs; a real screen-reader pass; Lighthouse in CI; the first CI and CodeQL runs; enable GitHub secret scanning and push protection; consider `prefetch={false}` on Explore's links (ADR 0007).
