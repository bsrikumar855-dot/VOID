# VOID — Implementation Status

Single human-readable status file. Machine-readable task state lives in `docs/auto-builder/TASKS.md` (AUTO-BUILDER's source of truth); if they disagree, `TASKS.md` wins and this file is stale.

Rule: a feature is **Verified** only with evidence (a command that was run and what it showed). Otherwise **Partially verified** or **Untested**. Nothing here is a claim of production readiness or of security.

_Last updated: 2026-11-08, after the first vertical slice and its independent reviews._

## Current state

| Field | Value |
|---|---|
| Phase | First vertical slice (M1 + M2 + M3) built, independently reviewed (ADR 0006), review fixes applied and tested |
| Repo | https://github.com/bsrikumar855-dot/VOID, branch `main` |
| Deployed | No. Nothing is deployed; deployment needs the owner's authorisation. |
| Blockers | None open. (Git went missing from the machine mid-build and was reinstalled with a hash-verified installer; see "Environment problems".) |

## The owner's first-slice definition

| Item | State | Evidence |
|---|---|---|
| Distinctive homepage | **Partially verified** | Inspected as screenshots at 360/768/1280, dark and light; `tests/e2e/home.spec.ts` asserts spec copy and CTAs, live hero, reduced motion, no invented content, real links, no horizontal scroll, headline/canvas non-overlap, axe. "Distinctive" is a judgement that only the lead and the model reviewers have made; no human besides the owner has seen it. Performance unmeasured. |
| Working experiment registry | **Verified** | `tests/unit/registry-contract.test.ts` (folder-vs-registry, unique ids/slugs, valid defaults, examples, loader resolves). The loader test only checks that `mount` is a function. |
| One complete interactive experiment | **Verified for the defined subset** | Algorithm Arena = 4 algorithms (bubble, insertion, merge, quick). Core tests: property, golden traces (incl. hand-verified merge trace), stepping == run-to-end; e2e: run/pause/step/reset, shortcuts, painting, completion counters. Spec §4.5 lists ~20 algorithms; the rest are **not built**. |
| Reusable experiment interface | **Partially verified** | `src/engine/types.ts` + `public.ts`; lint boundaries (alias and relative imports) proven to fire. **Gaps:** "add a second experiment" never exercised (one experiment exists; the real edit is an import plus an entry); `play/pause/reset/step` handle methods are driven only through the UI, never directly; `destroy()` idempotence and `ExperimentErrorBoundary` have no direct test. |
| Configuration serialization | **Verified** | `tests/unit/share-codec.test.ts` (round trip + 42-case hostile corpus with exact reasons), `tests/unit/security-regressions.test.ts` (4000-case seeded mutation fuzz, deep nesting, max-size bounds). |
| Working shareable experiment URL | **Verified** | `tests/e2e/arena.spec.ts`: a fresh browser context reproduces settings AND results; painted data survives the round trip; hostile links show a notice and defaults. |

## Checks run (final run, 2026-11-08; Windows 11, Node 24.13.1, Edge via Playwright)

| Check | Result |
|---|---|
| `npm run typecheck` | clean |
| `npm run lint` | clean (includes architecture-boundary rules and `react/no-danger`) |
| `npm run format:check` | clean |
| `npx vitest run` | 166 passed (8 files) |
| `npm run build` | succeeds |
| `npx playwright test --workers=2` | **112 passed** (desktop and 360px mobile projects; includes axe scans) |
| `npm audit --omit=dev --audit-level=high` | 0 vulnerabilities (last checked at the CI-file step). `npm audit` overall: 8 moderate in dev lint tooling, not fixed. |

Notes: the default Playwright parallelism (8 workers) crashed browsers once while the C: drive was full; always use `--workers=2` on this machine. E2E runs against a production build only.

**Not run:** Lighthouse (no performance numbers exist; the 90+/95+ targets are **unmeasured**), cross-browser (only Edge/Chromium), screen-reader testing (**Untested**), real-device mobile, GitHub CI (the workflow file exists but has never run), `/review`, `/qa`, `/ship` gstack workflows, penetration testing or automated security scanning.

## Independent reviews (ADR 0006)

Three read-only model reviewers (QA, security, critical) read the code and tests; none could run anything. Security: **no known confirmed Critical, High or Medium findings in the reviewed scope** (static inspection only; transitive CVEs, deployment headers and non-Chromium browsers not reviewed). Their defects were fixed with regression tests (list in ADR 0006). Open items they raised are listed there and below.

## Milestones

| ID | Milestone | State |
|---|---|---|
| M0 | Foundation and discovery | Done (spec, docs, reduced-form gstack reviews, ADRs 0001-0006, roadmap) |
| M1 | Application foundation | Done |
| M2 | Engine + Algorithm Arena + share links | Done |
| M3 | Homepage + Explore + CONTRIBUTING | Done. **Terminal not built** (spec §10; outside the owner's slice) |
| M4 onward | Neural network, Glitch Lab, Systems, AI Arena, X-Ray, accounts, community, hardening | Not started |

## Known gaps and honest limitations

- **Terminal** (spec §10, acceptance #4) not built; the design docs' header Terminal trigger was dropped (ADR 0006).
- Spec §4.5 breadth (searching, graphs, data structures, scheduling) not built.
- Painting data needs a pointer; the data/size/seed controls are the keyboard path.
- Share links carry no per-config preview image (ADR 0002); "Private/Publish" do not exist (M7).
- CSP allows `'unsafe-inline'` scripts (ADR 0004): not a strong XSS defence; revisit before M7.
- `partialPrefetching: false` is a temporary pin (ADR 0005).
- Impeccable's launcher, hook and image comps not run; `DESIGN.md` in Impeccable's format is not written yet. `PRODUCT.md` is.
- No analytics, so none of the spec §24 metrics are measured.
- Test-suite gaps: several fixed sleeps in e2e; no test of the load-failure UI, the error boundary, direct handle methods, or theme-change canvas redraw; only production-build e2e.
- Security hygiene still open: actions pinned by tag not SHA; no secret-scan job; no CodeQL; HSTS left to the host.
- Layout shift from the hero placeholder (34rem) is unmeasured.

## Environment problems found during this build

1. **C: drive hit 0 GB free** midway through (ENOSPC, browser crashes). I deleted two of my own scratch folders to recover; the rest of what fills C: is not mine. Re-check free space before long runs.
2. **Git for Windows disappeared** (`D:\Git` left with only `bin\bash.exe` and `usr`, modified 17:44; GitHub Desktop's bundled git also gone). Cause unknown; I did not touch that folder. Reinstalled to `D:\Git` via winget (Git 2.56.0.4, installer SHA-256 verified by winget). The harness's Bash tool still reports a stale shell path, so PowerShell is used for git.

## Next

1. Measure Lighthouse on `/` and an experiment page; record results verbatim, including failures.
2. Write `DESIGN.md` for Impeccable from the built world.
3. Build experiment #2 (Neural Network Playground, per ADR 0002) on the engine, which also proves the "add one folder" claim; then Glitch Lab. Terminal when scheduled by the owner.
4. Close the open test and security-hygiene items above.
