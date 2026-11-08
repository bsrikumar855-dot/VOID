# 0005 — Impeccable craft-floor overrides, and a Next.js config decision

- Date: 2026-11-08
- Status: Accepted
- Amends: `docs/design-system.md` §10.2, §10.4 (design-system.md carries a pointer note)

## 1. Impeccable craft-floor overrides

The owner asked for the Impeccable skill to be used for frontend work. Its `reference/craft-floor.md` (v4.8.1, vendored at `.claude/skills/impeccable/`) lists patterns it refuses. Three of them contradicted the first draft of our design doc and the M1 home page, so the design changes:

| Was (design-system §10, M1 home) | Impeccable rule | Now |
|---|---|---|
| Small mono eyebrow `VOID / interactive technology` above the headline | "A kicker or eyebrow above a heading ... a ban, not a default" | Removed. The headline carries itself. |
| Status callout with `border-l-2` | "A colored border-left ... above 1px on callouts" | Full 1px bordered panel, no left rule. |
| Monospace for wordmark, buttons, footer, "technical feel" | "Monospace as a costume for 'technical' rather than for code, data, or measurement" | Mono is used **only** for data: counters, seed, share URL, complexity notation. UI chrome is Geist Sans. |

Also adopted as checks for every UI change: contrast >= 4.5:1 body, display <= 6rem, tracking >= -0.04em, body measure 65-75ch, no nested/identical icon-card grids, no hero-metric template (the race counters are a plain definition list, not big-number tiles), states for hover/disabled/loading/error/empty, themed browser surfaces.

**Not done (disclosed):** Impeccable's launcher (`impeccable context`) and its design hook, direction roll (`concept-seed`) and image-comp tools were **not run**. They need a binary download and, for comps, image generation (paid). The brief wins: the owner's spec pins palette, type and homepage content, so the direction was fixed by ADR 0003. `PRODUCT.md`/`DESIGN.md` in Impeccable's format are written at the finish of the first slice from the built result.

## 2. `partialPrefetching: false` (next.config.ts)

`create-next-app` 16.4.5 scaffolds `cacheComponents: true` and `partialPrefetching: true`. With partial prefetching on, an unknown `/experiments/<slug>` returned HTTP **200** on a cold request (a streamed shell, then `notFound()` rendering), so a bad URL looked like a successful page: a soft 404. Observed in the Playwright run (desktop failed, mobile passed, i.e. timing dependent). With `partialPrefetching: false`, `curl` returned 404 for an unknown slug and 200 for a known one, and the Playwright test passes on both projects.

Decision: keep `cacheComponents: true`, set `partialPrefetching: false`. The Next docs state both features become the default and the options are removed in the next major, so this is a temporary pin. **Revisit** when upgrading Next: re-run `tests/e2e/arena.spec.ts` ("unknown experiment slug is a 404").

## 3. Other findings recorded

- `npm audit`: 8 moderate findings in the dev lint toolchain (`typescript-eslint` chain via `eslint-config-next`). CI audits production dependencies at `--audit-level=high` (currently 0 vulnerabilities); the dev-only findings are not fixed.
- `react-hooks` v7 lint rules (`set-state-in-effect`, refs during render) caught real patterns in the first Arena draft; fixed by deriving state instead of syncing it in effects.
- axe caught a keyboard-access defect (scrollable table wrappers not focusable) introduced by a layout tweak; fixed with `role="region"`, label and `tabIndex=0`, covered by the e2e axe test at 360px.
