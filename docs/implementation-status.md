# VOID — Implementation Status

Single human-readable status file. Machine-readable task state lives in `docs/auto-builder/TASKS.md` (AUTO-BUILDER's source of truth); if they disagree, `TASKS.md` wins and this file is stale.

Rule: a feature is **Verified** only with evidence (a command that was run and what it showed). Otherwise **Partially verified** or **Untested**. Nothing here is a claim of production readiness or of security.

_Last updated: 2026-11-10, after the independent review of the second cycle (performance, architectural validation, experiment #2, hardening) and its fixes._

## Current state

| Field | Value |
|---|---|
| Phase | Second cycle complete except items listed under "Open". Two experiments, one engine. |
| Repo | https://github.com/bsrikumar855-dot/VOID, branch `main` |
| Deployed | No. Nothing is deployed; deployment needs the owner's authorisation. |
| GitHub CI / CodeQL | Both pass on `7e34c74` (CI run 42486559965, all 14 steps green including Linux Chromium e2e; CodeQL run 42486559968). The first CI run failed at typecheck on a clean checkout (missing generated Next route types); fixed in `7e34c74` by running `next typegen` first. Dependabot PRs triaged 2026-11-10: eslint 10, actions/checkout 7, actions/setup-node 7 and the grouped React and CodeQL v4 bumps merged; TypeScript 7 and @types/node 26 refused (ignored in `.github/dependabot.yml` until deliberately migrated). |

## Experiments

| Experiment | State | Evidence |
|---|---|---|
| Algorithm Arena (4 sorts, race, painting) | Verified for its defined subset | 78+ core tests, e2e, generic contract |
| Neural Network Playground (forward propagation, step-by-step, editable weights, 4 activations, XOR default) | Verified for its defined scope: core maths and schema by unit tests; UI behaviour by `tests/e2e/neural-network.spec.ts` (added after review: step/reset/replay, shortcuts, edit mid-run, live region, focus to editor, shape changes keep weights, randomize/load) | `nn-core.test.ts` (hand-verified XOR truth table, two nets cross-checked against independent Python, 300-network layout property test, schema and reshape tests incl. layer insert/remove retention), `nn-examples.test.ts`, the NN e2e spec, generic browser contract. Real screen-reader output still untested. |
| **Not built in experiment #2** | Training / backpropagation / datasets (spec §4.1 "training visualization") | the UI says plainly that no training happens |

## Extensibility: what was actually proven

Adding experiment #2 required, outside its own folder: one import plus one entry in `src/registry/index.ts`; a shared PRNG moved into the engine's public door (own commit); a generic isolation scan found and removed a hard-coded experiment name in the 404 page. Adding it also exposed a real scalability defect (every page importing the registry carried every experiment's view code); fixed by loading views by convention instead of through the manifest. With a temporary third experiment: `/explore` stayed at 175.7 KB gzipped initial JS and `/` grew 0.2 KB. Details: ADR 0008. **Limits of this proof:** two experiments, both React + Canvas/SVG on the main thread; nothing tests a WebGL, Web Worker or server-backed experiment; the third experiment was a copy.

## Checks run (2026-11-10 on the final commit of this cycle; Windows 11, Node 24.13.1)

| Check | Result |
|---|---|
| `npm run typecheck`, `npm run lint`, `npm run format:check` | clean |
| `npm run security:secrets` | 172 tracked files, no findings (pattern scan, see ADR 0008) |
| `npx vitest run` | **246 passed** (13 files) |
| `npm run build` + `npm run perf:budget` | succeeds; `/` 210.4, `/explore` 175.7, both experiment routes 210.4 KB gzip initial JS (budgets 225 / 195); all other JS (lazy views, other routes) 16.4 KB (budget 40, added after review) |
| `npx playwright test --workers=2` in **Edge** | **218 passed** (desktop and 360px mobile projects) |
| same in **Chrome** (`PW_CHANNEL=chrome`) | 192 passed on 2026-11-08 (before the review fixes); **not re-run** since. CI runs Linux Chromium on every push. |
| Lighthouse 13.6.0, final build | mobile performance **100** on `/`, `/explore`, Arena, Neural Network; desktop **100** on all four; accessibility, best-practices, SEO 100 everywhere. Mobile blocking time 72-81 ms, TTI 2.54-2.73 s. Median of 5 (mobile) / 3 (desktop) runs; `docs/perf/two-experiments-*.md` |
| `npm audit --omit=dev --audit-level=high` | 0 vulnerabilities at last check. Dev-only: moderate findings in lint tooling (not fixed). |

Lighthouse caveats: one machine, localhost, Lighthouse's simulated throttling, Edge, not in CI. The Arena page's desktop CLS is 0.057 (below 0.1). Default Playwright parallelism (8 workers) crashed browsers once while C: was full; always use `--workers=2` here.

**Not run:** Firefox and WebKit (Firefox is not installed; Playwright's build would need a download that was not approved); any screen reader (checklist in `docs/a11y/screen-reader-checklist.md`, results table empty); real devices and real networks; penetration testing. GitHub CI and CodeQL: see the table above (they have run and pass).

## Performance (ADR 0007)

Baseline was already 99-100. Kept: Zod-free `limits.ts` per experiment, Zod `jitless` (removed a CSP eval violation Chrome logged on every page loading Zod: best-practices 96 to 100), the bundle budget script and guards. Rejected with evidence: Next's experimental `inlineCss` (regressed mobile first paint and blocking time) and a lazy registry import (experiment pages became interactive ~400 ms later). Correction recorded: `/explore`'s critical path is Zod-free, but Next still prefetches the experiment routes it links to, so the network sees those chunks.

## Reviews

Independent QA, security and critical reviews of the first slice (read-only model agents that could not run code): no known confirmed Critical, High or Medium security findings in the reviewed scope; defects fixed with regression tests (ADR 0006). The second cycle was reviewed on 2026-11-10 by two read-only model agents (critical review and security review) that could not run code (Bash tool broken), so both were static reading. Security: no Critical/High/Medium; Low items fixed (non-vacuous fuzz assertion, `persist-credentials: false` with a guard test, wider secret patterns, stale docs). Critical review: six Medium findings, all fixed with regression tests: layer add/remove discarded the user's weights (reshape matched layers by index), the live region never announced the prediction, selecting a neuron gave keyboard users no feedback, the NN UI had no tests, two contract tests passed vacuously, the budget guards were hand-synced route lists and ignored lazy chunks. Also fixed: initial-load anchor false alert, stale debounce overwriting a pasted link, "above 0.5" at exactly 0.5, dead store, stale docs. The reviews are not penetration tests and found nothing a browser or real assistive technology would have shown.

## Known gaps and honest limitations

- Terminal (spec §10) not built; spec §4.5 breadth beyond four sorts not built; no neural-network training.
- CSP still allows inline scripts (ADR 0004): not a strong XSS defence; revisit before accounts (M7).
- Security hygiene: secret scanning is a pattern scan (enable GitHub secret scanning and push protection in repository settings, an owner action); HSTS left to the host.
- Review items left open (Low): the homepage hero copy still names sorting races (not generic); the Neural Network mount ignores `presentation`, so it would embed full-page if it were ever the first registry entry; the ESLint core purity rule is bypassable (`globalThis`, destructured `Math`, `.tsx` in core) and the isolation test does not see `require()`; the diagram's weight thickness saturates at |w| = 2; very large linear values overflow the node circle; the diagram focus ring is only a thicker stroke (contrast unmeasured); `fmt` is copied in three files; two fixed sleeps remain in e2e; "Try again" after a failed chunk load is untested (a bundler may cache a rejected import); closing the neuron editor does not return focus to the neuron.
- The Arena still has its own copy of the PRNG (the engine exports one); deduplicating it would modify an unrelated experiment.
- Painting data in the Arena needs a pointer; the data/size/seed controls are the keyboard path.
- Neural Network diagram needs a horizontal scroll region on phones (readable size over a squeezed overview).
- Test-suite gaps carried over: some fixed sleeps in e2e; no test of the load-failure UI or the error boundaries; production-build e2e only.
- Impeccable's launcher/hook/comps still not run; `DESIGN.md` in its format not written.
- No analytics, so no spec §24 metrics.

## Environment problems found during this work

C: drive ran out of space earlier (recovered; ~2.4 GB free now, npm cache for the Lighthouse install redirected to D:). Git for Windows disappeared mid-session (reinstalled to `D:\Git`, installer hash verified by winget); the harness Bash tool still reports a stale shell path, so PowerShell is used. PowerShell's `Set-Content -Encoding UTF8` added a BOM to four files; stripped in a dedicated commit, and edits since use Python instead.

## Open / next

1. TypeScript 7 migration (Dependabot ignores majors until then).
2. Owner actions: approve a Firefox test download; enable GitHub secret scanning and push protection; run the screen-reader checklist (or approve another approach).
3. Re-review after the fixes above, ideally with an agent that can run code (the Bash tool is still broken here), and human screen-reader testing.
4. Experiment #3 (Glitch Lab) is the right next test of the engine: it brings canvas/WebGL performance, `prefers-reduced-motion` and image export; Terminal when the owner schedules it.
