# 0006 — Outcomes of the independent reviews of the first slice, and recorded deviations

- Date: 2026-11-08
- Status: Accepted
- Reviewers: three read-only agents (`qa-engineer`, `security-engineer`, `critical-reviewer`) working from the code, docs and tests. **None of them could run anything** (the Bash tool was down at the time), so every runtime claim in their reports was inferred from reading; the lead verified fixes by running the test suites afterwards. They are independent of the author of the code, but they are model reviewers, not human ones.

## Security review (static inspection only; no scanning, no penetration testing)

Result: **no known confirmed Critical, High or Medium findings in the reviewed scope.** Scope: the share-link codec and host, Arena config/core/view, shell, layout theme script, next.config headers/CSP, CI, dependencies. Not reviewed: transitive dependency CVEs, runtime headers on a deployment, non-Chromium browsers, Next internals. This is not a statement that the application is secure.

| Finding | Severity | Disposition |
|---|---|---|
| F1 CSP allows inline scripts; `dangerouslySetInnerHTML` rule not enforced | Low | **Fixed** (`react/no-danger` = error, one justified exception; grep test; ADR 0004 residual risk stays and blocks M7) |
| F2 `hashchange` treated any same-page hash (the skip link) as a damaged share link, resetting the experiment | Low (real bug) | **Fixed** (non-share hashes ignored and the share URL restored; regression e2e) |
| F3 `replaceState` URL built by string concatenation | Low | **Fixed** (`new URL`) |
| F4 CI/process hygiene; `docs/security.md` stale vs ADR 0004 | Low | **Partly fixed**: `security.md` updated, `SECURITY.md` and Dependabot added. **Open:** actions pinned by tag not SHA; no secret-scan job; no CodeQL |
| F5 header test thin; `blob:` allowed but unused | Low | **Fixed** (`blob:` removed; header tests on 4 routes incl. 404) |
| F6 vendored skill / `AGENTS.md` / environment event | Info | Nothing in build/test/CI executes the skill launcher (verified by the reviewer by grep). Git disappearing from the machine remains unexplained. |

## QA findings

Fixed (each with a regression test): Ctrl/Cmd/Alt+S/R shortcuts hijacked; hero left chart trapped touch scrolling and allowed painting; `pointercancel` left stale paint data; painted height offset from the cursor; last sample of a stroke dropped on pointer-up; Step lost keyboard focus at the end (now `aria-disabled`); self-running hero spoke into the live region every cycle; unmount during effect cleanup (now deferred); pending paint frame firing after unmount; share-link write racing a hash change during load; "Copy link" could copy a URL up to 150 ms stale (now flushes first); typing in the Seed field reset the race on every keystroke (now commits on Enter/blur); merge-sort highlights pointed at snapshot positions (merge now compares on the live array and copies back, with a hand-verified golden trace).

Test-suite weaknesses acknowledged, **still open**: several fixed `waitForTimeout` sleeps (some are negative "nothing changed" checks); no test of the load-failure UI ("could not be loaded / Try again"); no test of `ExperimentErrorBoundary`; no test that exercises `play/pause/reset/step` handle methods directly (only through the UI); only production-build e2e (StrictMode double-mount and dev warnings unobserved); theme-change canvas redraw untested; `destroy()` idempotence is exercised only indirectly by navigation cycles.

## Critical review findings

Fixed: homepage copy that claimed navigation and everything else is derived from the registry (header has one generic Explore link; the copy now says exactly what is derived); hard-coded featured slug (hero = first registry entry); hard-coded "three" example count; example list keyed by title only; "Every setting is in the link" (playback speed is not; copy now says so and the share box label says what it covers); "watch every comparison, swap and write" (not literally true at speed; reworded); metadata mentioned "remix" (not built); custom `not-found` and `error` pages added; error boundary inside each experiment root (`ExperimentErrorBoundary`); relative-import bypass of the lint boundary; preset labels in Title Case, "Next seed" button, `<ul>` semantics, `text-balance`, `::selection` and scrollbar theming; unused `ExperimentStatus` type and dead colour removed; CONTRIBUTING.md corrected (`"use client"`, import + entry, `format:check`).

## Recorded deviations from the design docs and spec (owner may override)

| Planned | Reality | Reason |
|---|---|---|
| Terminal trigger in the header (design-system §10.3, ADR 0003) | **Not built** | Not part of the owner's slice definition; the registry-driven navigation story is cleaner without a half-built terminal. Spec §10 and acceptance #4 remain unmet. |
| Invalid-link panel with "Open with defaults" and "Copy details" (§10.8) | Single "Dismiss"; defaults are already loaded | Simpler and sufficient; no information is lost |
| Reduced motion shows a final-state frame (§10.6) | Shows step 0 with Run available | Simpler; nothing autoplays |
| `[` `]` speed keys (§10.7) | Not built; the speed slider is keyboard operable | Redundant control |
| "Adding a second experiment touches only its folder plus one line, proven by adding one" | **Unproven**: only one experiment exists; the real edit is an import plus an entry | Honest wording in CONTRIBUTING and homepage; prove it with experiment #2 (M4) |
| Hero "device-qualified lazy island" (roadmap) | The hero mounts after hydration and pauses off-screen; no WebGL/capability gate (Canvas 2D only) | Canvas 2D is cheap; measure with Lighthouse before adding gates |
| Painting available without a pointer (a11y) | Pointer only; data/size/seed controls are the keyboard path | Documented in the UI copy |

## Process note

All work in this slice is committed and pushed after each change as the owner instructed, except that the commits for the homepage and tests were delayed while Git was missing from the machine and then made in separate commits. The status document (`docs/implementation-status.md`) is the source for what is verified.
