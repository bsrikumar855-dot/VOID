# 0003 — Design direction for the first slice ("instrument")

- Date: 2026-11-08
- Status: Accepted (owner delegated routine design decisions; no consequential fork required)
- Full detail: `docs/design-system.md` section 10
- Inputs: master spec §11–§12, ADR 0001, `docs/designs/void-vertical-slice.md`

## Decision summary

1. **Concept:** VOID as a precision instrument panel for ideas. Dark field, hairline structure, Geist Mono readouts, one live specimen on stage.
2. **Hero = the live sorting race** (two algorithms, same data), placed beside the headline, never behind text. Pointer drag paints data into the race (real interaction, part of shareable state).
3. **Homepage sections in this slice:** hero, registry-driven live experiments (editorial list, not a card grid), how the share link works (with a real link), how to contribute, a plainly labelled "planned" list, footer. Sections needing non-existent data (community creations, featured creators, trending, daily discovery) are omitted.
4. **Navigation shows only areas with a working experiment** (Explore, Labs) plus Terminal and theme toggle. Terminal answers honestly for empty areas.
5. **Type/shape:** Geist Sans + Mono, no serif in the slice; 4px unit; 2px/4px radii; no shadows, no glows.
6. **Light theme** is designed deliberately in M1 as a second token set so `theme light` is a real action.
7. **Motion:** 120/240/480ms tokens; the race is the only continuous animation; reduced-motion = no autoplay + Step/Play.
8. **Accessibility of the canvas:** role=img + live label, throttled aria-live summary, data-table toggle, keyboard controls.
9. **Review gate for every UI change:** 20-ban checklist → Impeccable critique/audit → rendered check at 360/768/1280.

## Process disclosure

- The gstack `/plan-design-review` requires a per-issue approval round trip for each gap and image generation for mockups. It was run in a **condensed form**: the design decisions above were made by the lead and recorded, not approved issue by issue. The owner delegated routine decisions ("ask only for consequential forks").
- Mockups were **not generated**: the gstack designer needs an image-API key and paid calls (not authorised). Visual verification happens in the browser at implementation time.
- No Codex/outside design voice was run.
- Impeccable is vendored at `.claude/skills/impeccable` (v4.8.1). Its launcher downloads a binary on first run; that was **not** run (no explicit permission to download an executable). Its reference playbooks are read directly instead. Enabling the launcher is an open owner question.

## Rated gaps (plan design completeness 5/10 → 8/10)

Closed: hierarchy, homepage structure, nav policy, state encoding, motion, canvas a11y, empty/error states.
Still open (needs rendering, not planning): measured contrast, real typography rendering, mobile layout feel, hero legibility on small screens.
