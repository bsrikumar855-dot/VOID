# VOID — Roadmap and Quality Gates

Authority: master spec §19 (milestones), re-ordered by ADR 0001/0002 into vertical slices. Machine-readable task state: `docs/auto-builder/TASKS.md` (AUTO-BUILDER owns execution; gstack provides review/QA/ship; there is no second autonomous loop). Status: `docs/implementation-status.md`.

## Milestone map (spec → this roadmap)

| This roadmap | Spec | Outcome | Independently testable by |
|---|---|---|---|
| **M0** Foundation and discovery | M0 | Docs, reviews, ADRs, roadmap | Docs exist and cross-reference; ADRs 0001–0003 |
| **M1** Application foundation | M1 | Running Next.js shell, tokens (dark + light), nav, theme, CI, lint/test harness, security headers, CSP decision | `npm run check` green; Playwright smoke on shell; axe on shell |
| **M2** Engine + Algorithm Arena + share links | M3 + part of M4 | Registry, `ExperimentDefinition/Handle`, Arena (bubble, insertion, merge, quick), codec, experiment page, fragment share link | Unit/golden tests, codec corpus, Playwright share-link round trip |
| **M3** Homepage + Explore | M2 | Homepage whose hero is the live race; `/explore` from the registry; contribution guide | Playwright homepage/nav/terminal; axe; rendered check at 360/768/1280; Lighthouse measured |
| M4 | M4 | Experiment #2 (Neural Network Playground), Glitch Lab; experiment #3 proves "add one folder" | Math tests vs hand-computed values; registry contract test |
| M5 | M5 | Systems: Traffic Simulator, then others by evidence | Seeded deterministic sims tested |
| M6 | M6 | AI Arena (demo mode first), Codebase X-Ray, API Playground — each gated by security-engineer review | Security tests (SSRF corpus etc.), budget/cancel tests |
| M7 | M7 | Auth, profiles, save/publish/version, `/v/<id>` links, remix | RLS policy tests (5 actor types), e2e publish/remix |
| M8 | M8 | Bookmarks, likes, comments, challenges, moderation — **only after share-link demand evidence** | AuthZ tests, moderation flows |
| M9 | M9 | Hardening: security/a11y/perf reviews, cross-browser, deploy readiness (no deploy without authorization) | Final reviews, full e2e, measured Lighthouse |

## First vertical slice (owner definition) = M1 + M2 + M3

Homepage · registry · one complete experiment · reusable interface · config serialization · working shareable URL. The slice is done only when all six are Verified in `implementation-status.md` with evidence.

## Per-milestone gate (AUTO-BUILDER Quality protocol)

Acceptance criteria written in `TASKS.md` → implement → run tests + regression → independent review where required (`critical-reviewer`, `qa-engineer`; `security-engineer` when the Security gate triggers) → criteria marked Verified / Partially verified / Untested with evidence → docs updated → no open blocker/major → local checkpoint commit and push (owner instruction: commit and push after every change). Iteration budget 5 passes per milestone; 3 attempts per failing check.

## Quality gates (every milestone must satisfy those that apply)

### Architecture
- Experiments touch only `src/experiments/<slug>` + one registry line; registry is the only list (home, nav, explore, terminal derive from it).
- `core/` imports no DOM/React (lint-enforced); experiments import only `engine/public`, never each other (lint-enforced).
- Contract tests pass: unique slugs, `defaultConfig` valid and round-trips, mount→destroy twice leaks nothing.
- No dependency added without a named job; additions recorded in an ADR if they are libraries from the deferred list.

### Frontend / design
- Anti-slop checklist (design-system §6) passed and written in the review note; Impeccable critique/audit run on changed UI.
- Rendered check at 360, 768 and 1280 widths with screenshots; no horizontal scroll; hero legible.
- Every nav item and CTA reaches a working destination. No fake numbers, activity, users or AI output.
- Loading, empty, error states exist for each new surface.

### Security
- Security gate applicability decided and recorded per milestone (`docs/auto-builder/DECISIONS.md`).
- Fragment codec passes the hostile corpus (M2). Security headers present (M1). CSP decision recorded (M1 spike).
- From M6: SSRF corpus, budget/timeout tests; from M7: RLS tests for anon/authed/owner/other/moderator.
- No secrets in repo; `.env.example` only; secret scan + `npm audit` in CI.
- Wording: "no known confirmed Critical or High findings in the reviewed scope", never "secure".

### Performance (targets, measured not assumed)
- Budgets set in M1 and recorded: initial JS per route, LCP, CLS, INP. Hero canvas is a lazy, device-qualified island; LCP element is the headline.
- Lighthouse run on `/` and an experiment page at M3; results recorded verbatim in `implementation-status.md` including failures. Targets: Performance >= 90, Accessibility >= 95.
- Animation loops and listeners disposed on destroy (tested).

### Accessibility (WCAG 2.1 AA target)
- axe (via Playwright) has zero serious/critical violations on each shipped page in default, running and error states.
- Keyboard-only operation of every control including the terminal; visible focus; reduced-motion test (no autoplay); canvas text alternative + throttled aria-live; token contrast unit test.
- Manual screen-reader pass is **not** claimed unless performed; recorded as Untested otherwise.

## Risks tracked

Scope breadth of the spec; CSP vs static pages (M1 spike); Next/React/Tailwind latest-version compatibility (verify at M1); fragment links lack per-config previews until M7; solo-maintainer moderation load (hence M8 gating); Impeccable launcher not enabled (owner decision open).

## Owner decisions still open

Deploy target/domain (no deploy without authorization); AI providers/keys/budget (M6); Supabase project (M7); Impeccable launcher download permission; analytics approach for spec §24 metrics; editorial serif; whether `main` direct pushes remain acceptable once CI exists.
