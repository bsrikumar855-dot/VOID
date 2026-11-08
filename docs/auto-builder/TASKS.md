# Execution backlog

## Status (update after every task — this is the resume point after compaction)

| Field | Value |
|---|---|
| Current phase | Phase 8 for the first slice (delivery pending owner review); Phase 5 for M4 not started |
| Current milestone | First slice (M1+M2+M3) complete; next: M4 (experiment #2) |
| Pass for this milestone (budget: 5 by default; edit here) | 2 / 5 (pass 1: build; pass 2: fixes after independent review) |
| Total passes, all milestones | 2 |
| Failing checks → attempts (one line per distinct check; max 3 each) | none currently failing; see docs/implementation-status.md for open gaps |
| Last verified commit | see git log on main (final verification run 2026-11-08: 166 unit, 112 e2e passing) |
| Independent review done for current milestone? | yes (QA, security, critical; model reviewers, read-only, could not run code) - ADR 0006 |

## Milestone gates

| Milestone | Expected outcome | Verification command(s) | Tests run | Regression run | Review (independent?) | Criteria verified | Docs updated | Open blocker/major | Gate passed |
|---|---|---|---|---|---|---|---|---|---|

## Acceptance checklist

| ID | Criterion (measurable) | State (Verified / Partially verified / Untested) | Evidence (command + observed result) |
|---|---|---|---|

## Tasks

| ID | Task | Milestone | Dependencies | Acceptance criteria | Verification | Status | Owner | Files owned |
|---|---|---|---|---|---|---|---|---|
| M1-1 | Scaffold Next.js App Router + TS strict + Tailwind; pin versions after registry check | M1 | none | `npm run build` succeeds; `tsc --noEmit` clean | `npm run check` | done | lead | package.json, tsconfig, next.config, src/app |
| M1-2 | Tokens: dark + light sets, semantic CSS vars, `--border-strong`; contrast unit test | M1 | M1-1 | Every text/bg pair >= 4.5:1, UI >= 3:1, measured by test | `npm test` | done | lead | src/styles, tests/unit |
| M1-3 | Layout, nav (Explore, Labs only), theme toggle, skip link, footer | M1 | M1-2 | Keyboard operable; renders at 360/768/1280 | Playwright + axe + screenshots | done | frontend-engineer | src/components |
| M1-4 | Security headers; CSP spike and decision ADR | M1 | M1-1 | Headers present in response; ADR records CSP choice | Playwright header assertion | done | lead | next.config |
| M1-5 | ESLint boundary rules, Prettier, Vitest, Playwright, CI workflow | M1 | M1-1 | Lint fails on forbidden import (proved by a fixture test); CI file valid | `npm run check` | done | lead | eslint config, .github |
| M2-1 | Engine types + registry + contract tests | M2 | M1 | Unique slugs, defaults valid, destroy idempotent | Vitest | done | lead | src/engine |
| M2-2 | Sorting core (4 algos, op-trace generators, mulberry32) | M2 | M2-1 | Property + golden trace tests pass | Vitest | done | lead | src/experiments/algorithm-arena/core |
| M2-3 | Fragment codec with hostile corpus | M2 | M2-1 | All corpus cases `{ok:false}`; round-trip identity | Vitest | done | lead | src/engine/share |
| M2-4 | Arena view (Canvas 2D), controls, a11y, experiment page | M2 | M2-2, M2-3 | Keyboard play/pause/step; reduced-motion no autoplay | Playwright + axe | done | frontend-engineer | src/experiments/algorithm-arena/view, src/app/experiments |
| M3-1 | Homepage with hero race, registry-driven sections | M3 | M2 | Matches design-system s10; no fake data | Playwright + screenshots + Impeccable critique | done | frontend-engineer | src/app/page |
| M3-2 | /explore from registry; CONTRIBUTING.md | M3 | M2 | Lists only registered experiments | Playwright | done | lead | src/app/explore, CONTRIBUTING.md |

(Original template table header retained below for reference.)

| ID | Task | Milestone | Dependencies | Acceptance criteria | Verification | Status | Owner | Files owned |
|---|---|---|---|---|---|---|---|---|

## Blockers

## Deferred / out of scope (needs user approval)

## Recently completed

## Milestone gate (first slice)

| Milestone | Tests run | Regression run | Review (independent?) | Criteria verified | Docs updated | Open blocker/major | Gate passed |
|---|---|---|---|---|---|---|---|
| M1 + M2 + M3 | typecheck, lint, format, 166 unit, 112 e2e (2 workers) | full suites re-run after review fixes | QA + security + critical model reviewers (independent of the author, read-only) | Registry, serialization, share URL, Arena subset Verified; homepage and reusable interface Partially verified (see implementation-status.md) | yes | No blocker; majors from the critical review fixed or recorded as deviations (ADR 0006); Terminal not built | Yes for the owner's slice definition, with the stated gaps; NOT a production-readiness claim |

## Deferred / needs owner decision

- Terminal (spec section 10), spec section 4.5 breadth, Lighthouse measurement, DESIGN.md, deployment, Impeccable launcher download permission, AI provider and budget, analytics approach.
