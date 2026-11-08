# VOID — Design System (planning draft)

Source: master spec §11, §12, §18. Status: **draft; final direction established by `/plan-design-review` and the Impeccable skill (`.claude/skills/impeccable`).** Impeccable's `PRODUCT.md` / `DESIGN.md` context files, when created, must stay consistent with this document; if they diverge, the master spec wins.

## 1. Art direction

A sophisticated digital universe: experimental web design × scientific visualization × creative coding × editorial typography × technical interfaces × spatial composition × minimalism. Recognisably VOID: dark, precise, instrument-like, with a distinct point of view. Visuals are *data and computation made visible*, not decoration.

## 2. Tokens (spec §11) — semantic, defined once

| Semantic token | Spec value | Use |
|---|---|---|
| `--bg` | `#090B10` | Page background |
| `--surface` | `#11151E` | Panels |
| `--surface-raised` | `#171D29` | Elevated surfaces, popovers |
| `--accent` | `#8B9DFF` | Primary accent, focus, key data |
| `--accent-2` | `#A1F0C4` | Secondary accent, success/live |
| `--text` | `#F1F3F8` | Main text |
| `--text-muted` | `#929BAC` | Secondary text |
| `--border` | `#252C39` | Hairlines |

Components consume semantic tokens only — never raw hex. Status colors (error/warn) are added as tokens with contrast verified; **never rely on color alone** to convey state (§18). Contrast ratios for every text/background pair are computed and recorded at M1 (WCAG 2.1 AA: 4.5:1 body, 3:1 large/UI). Muted text `#929BAC` on `#11151E`/`#171D29` must be measured, not assumed.

A light theme is required by `theme light` (§10). It is designed deliberately (not an inversion) and recorded in an ADR before shipping.

## 3. Typography

Geist Sans (UI, headlines), Geist Mono (technical data, terminal, labels), optional editorial serif for selected storytelling moments only. One type scale, one set of line-heights; hierarchy by size/weight/spacing, not by many fonts. Serif choice is an owner decision (open question).

## 4. Layout and composition

- Varied editorial compositions per section (§12): asymmetric grids, full-bleed instruments, annotated diagrams, ticker-like strips — **not** a repeated card grid.
- Spatial depth is used where it explains something (layers, graph depth), not as ornament.
- Corner radii small and consistent; no pill-everything. Borders are 1px hairlines; no glow borders.
- 16px minimum mobile gutters; touch targets ≥ 44px; every layout designed at 360px first for pointer-less use.

## 5. Motion

Motion must have a functional or storytelling purpose (§11): state change, causality, orientation, feedback. Allowed: meaningful route/panel transitions, controlled particle movement, hover/focus feedback, loading transitions. Forbidden: scroll hijacking, gratuitous parallax, looping decoration. **`prefers-reduced-motion` produces a real alternative** (static or stepped), tested. Durations and easings are tokens.

## 6. Anti-AI-slop rules (hard gates — §11)

The 20 bans from the spec are a review checklist run on every UI change: (1) generic AI-startup landing page, (2) excess gradients, (3) generic glassmorphism, (4) identical cards everywhere, (5) random floating objects, (6) unnecessary glowing borders, (7) excess rounded containers, (8) fake statistics, (9) fake user activity, (10) empty nav destinations, (11) decorative buttons with no action, (12) excess animation, (13) scroll hijacking, (14) repetitive section layouts, (15) generic marketing language, (16) inconsistent typography, (17) random visual effects, (18) poor mobile layouts, (19) unnecessary dependencies, (20) fake AI functionality.

Operational additions: every button/link has a working destination or action; every number on screen is computed from real data or labelled as an illustrative example in plain words; no lorem/placeholder copy; no stock-looking hero illustration.

## 7. Homepage direction (§12) — to be sharpened in design review

Hero: headline "THE WEB IS YOUR PLAYGROUND." with the specified supporting copy and two CTAs; interactive environment (candidate: a node/particle field that responds to the pointer and is *actually a small working system* — e.g. a live graph or sorting/flow demo — so the hero is itself an experiment). Text and nav stay legible over it (contrast measured over the visual). Sections follow §12's order with a distinct composition each. Sections that would need data that doesn't exist yet (community creations, featured creators, trending) must show honest empty/early states or be deferred — never fabricated.

## 8. Accessibility (WCAG 2.1 AA — §18)

Semantic landmarks; keyboard operable everything (including the terminal and canvases' controls); visible focus; focus management in dialogs/terminal; screen-reader names/roles; live-region announcements for errors and simulation state changes where meaningful; text alternatives or data-table equivalents for visualizations' key information; reduced motion; touch-friendly targets.

## 9. Component policy

shadcn/ui is a source of accessible primitives (dialog, popover, tabs); each is restyled to tokens. No component-library default appearance ships (§11). New components go through the same slop checklist.
