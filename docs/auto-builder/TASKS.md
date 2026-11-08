# Execution backlog

## Status (update after every task — this is the resume point after compaction)

| Field | Value |
|---|---|
| Current phase | Phase 4 complete (planning); entering Phase 5 implementation |
| Current milestone | M1 Application foundation |
| Pass for this milestone (budget: 5 by default; edit here) | 0 / 5 |
| Total passes, all milestones | 0 |
| Failing checks → attempts (one line per distinct check; max 3 each) | |
| Last verified commit | n/a (docs only so far) |
| Independent review done for current milestone? | n/a |

## Milestone gates

| Milestone | Expected outcome | Verification command(s) | Tests run | Regression run | Review (independent?) | Criteria verified | Docs updated | Open blocker/major | Gate passed |
|---|---|---|---|---|---|---|---|---|---|

## Acceptance checklist

| ID | Criterion (measurable) | State (Verified / Partially verified / Untested) | Evidence (command + observed result) |
|---|---|---|---|

## Tasks

| ID | Task | Milestone | Dependencies | Acceptance criteria | Verification | Status | Owner | Files owned |
|---|---|---|---|---|---|---|---|---|
| M1-1 | Scaffold Next.js App Router + TS strict + Tailwind; pin versions after registry check | M1 | none | `npm run build` succeeds; `tsc --noEmit` clean | `npm run check` | todo | lead | package.json, tsconfig, next.config, src/app |
| M1-2 | Tokens: dark + light sets, semantic CSS vars, `--border-strong`; contrast unit test | M1 | M1-1 | Every text/bg pair >= 4.5:1, UI >= 3:1, measured by test | `npm test` | todo | lead | src/styles, tests/unit |
| M1-3 | Layout, nav (Explore, Labs only), theme toggle, skip link, footer | M1 | M1-2 | Keyboard operable; renders at 360/768/1280 | Playwright + axe + screenshots | todo | frontend-engineer | src/components |
| M1-4 | Security headers; CSP spike and decision ADR | M1 | M1-1 | Headers present in response; ADR records CSP choice | Playwright header assertion | todo | lead | next.config |
| M1-5 | ESLint boundary rules, Prettier, Vitest, Playwright, CI workflow | M1 | M1-1 | Lint fails on forbidden import (proved by a fixture test); CI file valid | `npm run check` | todo | lead | eslint config, .github |
| M2-1 | Engine types + registry + contract tests | M2 | M1 | Unique slugs, defaults valid, destroy idempotent | Vitest | todo | lead | src/engine |
| M2-2 | Sorting core (4 algos, op-trace generators, mulberry32) | M2 | M2-1 | Property + golden trace tests pass | Vitest | todo | lead | src/experiments/algorithm-arena/core |
| M2-3 | Fragment codec with hostile corpus | M2 | M2-1 | All corpus cases `{ok:false}`; round-trip identity | Vitest | todo | lead | src/engine/share |
| M2-4 | Arena view (Canvas 2D), controls, a11y, experiment page | M2 | M2-2, M2-3 | Keyboard play/pause/step; reduced-motion no autoplay | Playwright + axe | todo | frontend-engineer | src/experiments/algorithm-arena/view, src/app/experiments |
| M3-1 | Homepage with hero race, registry-driven sections | M3 | M2 | Matches design-system s10; no fake data | Playwright + screenshots + Impeccable critique | todo | frontend-engineer | src/app/page |
| M3-2 | /explore from registry; CONTRIBUTING.md | M3 | M2 | Lists only registered experiments | Playwright | todo | lead | src/app/explore, CONTRIBUTING.md |

(Original template table header retained below for reference.)

| ID | Task | Milestone | Dependencies | Acceptance criteria | Verification | Status | Owner | Files owned |
|---|---|---|---|---|---|---|---|---|

## Blockers

## Deferred / out of scope (needs user approval)

## Recently completed
