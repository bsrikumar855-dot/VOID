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

---

> **AMENDED 2026-11-08 by ADR 0005 (Impeccable craft floor).** Where section 10 below mentions a mono eyebrow above the headline, a left-rule callout, or mono for UI chrome, ADR 0005 overrides it: no eyebrow, no left-border callouts, mono only for data (counters, seed, URLs, complexity notation).

## 10. Design review decisions (2026-11-08) — binding for the first slice

Result of the condensed `/plan-design-review` (see ADR 0003). Plan design completeness: **5/10 before, 8/10 after** these decisions. Remaining gap to 10: nothing here has been seen rendered; contrast ratios are unmeasured; no mockups exist. Those are closed by M1 (measure) and the browser review (look).

### 10.1 Concept: "instrument"
VOID looks like a precision instrument panel for ideas: dark field, hairline structure, monospaced readouts, one live specimen on stage. The content is the visual. Recognisable by: Geist Mono numerals for every readout, thin vertical-line bar glyphs, a single accent per state, and no ornament that is not data.

### 10.2 Homepage (first slice)
Hierarchy in the first viewport, in order: (1) headline THE WEB IS YOUR PLAYGROUND, (2) the live sorting race, (3) the two CTAs. The race is the visual anchor; nothing decorative competes with it.

- **Desktop (>=1024px):** asymmetric split. Left column (~5/12): small mono eyebrow `VOID / interactive technology`, headline (Geist Sans, 700, tight tracking, clamp(2.5rem, 6vw, 5rem), uppercase as specified), supporting copy exactly as in the spec, CTAs. Right (~7/12): the race canvas, flush to the right edge, its own readouts below it in Geist Mono. **Text never sits on top of the canvas**, so legibility needs no scrim.
- **Mobile (360px first):** headline, copy, CTAs, then race at 16:10, then its controls. Nav collapses to a menu button + terminal button (44px targets).
- **Pointer response (real, not decorative):** pointer-down and drag over the race "paints" values into the array, restarting the race on the painted data. The painted data is part of the shareable state (seed or explicit values).
- **CTAs:** ENTER THE LAB goes to the Algorithm Arena experiment page. EXPLORE EXPERIMENTS goes to /explore (the registry listing). Both must exist and work before the homepage ships.
- **Secondary sections, in this slice:** (a) *Live experiments*: registry-driven, an editorial list of real experiments (one large feature entry + rows), not a card grid; (b) *How it works*: the share-link loop shown with a real, clickable example link; (c) *Build with us*: how to add an experiment (real contribution path), with repo link; (d) *Planned*: plain, non-clickable list of upcoming areas, each labelled planned; (e) footer with repo, license, accessibility note. Sections that need data that does not exist (community creations, featured creators, trending, daily discovery) are **omitted**, not faked. *Daily discovery* returns once the registry has >=3 experiments and is picked deterministically by date, labelled as such.

### 10.3 Navigation
Primary nav shows only areas that contain a working experiment: `Explore`, `Labs`. Other areas (Systems, AI Arena, Tools, Community) join the nav when they ship their first experiment. Always present: Terminal trigger (button + `Ctrl/Cmd+K`), theme toggle. The terminal's `systems`, `arena`, etc. answer honestly ("No experiments in Systems yet") and say what exists.

### 10.4 Type, space, shape
Geist Sans for UI/headlines, Geist Mono for readouts, labels, terminal. No serif in the slice. Scale: 12/14/16/20/28/40/clamp display (ratio ~1.25-1.4). Base unit 4px. Content max-width 1200px, 12-column grid, intentionally asymmetric. Radius: 2px controls, 4px panels, none elsewhere. Borders 1px `--border`. **No shadows and no glows**; elevation = surface token. Focus ring: 2px `--accent` with 2px offset, always visible.

### 10.5 Colour and state encoding
Tokens as in section 2. Race encoding must never rely on colour alone: *comparing* = accent bars + a bracket tick above; *sorted/placed* = secondary accent + baseline notch; *swapped* = brief 1-frame offset; legend present. Error/warn tokens to be added in M1 with measured contrast (target 4.5:1 text, 3:1 UI).
**Light theme:** designed deliberately in M1 as a second token set (not an inversion), contrast-measured, so `theme light` is a real action. Default is dark; follow `prefers-color-scheme` only until the user sets a theme.

### 10.6 Motion
Tokens: 120ms feedback, 240ms state, 480ms route; easing cubic-bezier(.2, 0, 0, 1). The only continuous animation on the homepage is the race, and it is the content. `prefers-reduced-motion`: race does not autoplay, shows a final-state frame and Step/Play controls; all transitions become instant. No scroll hijacking, no parallax.

### 10.7 Accessibility of the race
Canvas has `role="img"` and a live-updated label; a throttled `aria-live="polite"` summary ("Quick sort: 42 comparisons, 12 swaps, sorted") on state changes only; a "show data" toggle exposes the array and operation counts as a table. Keyboard: `Space` play/pause, `S` step, `R` reset, `[` `]` speed; all as labelled buttons too. Hit targets >=44px on touch.

### 10.8 Empty, loading, error states (specified now, built with the feature)
- Experiment loading: skeleton frame at final dimensions (no layout shift) with mono text `loading experiment`.
- Invalid share link: inline panel naming what failed ("This link's configuration is not valid for Algorithm Arena v1") + buttons "Open with defaults" and "Copy details"; never a blank page or a crash.
- WebGL/canvas unavailable: static frame + text alternative; sorting race uses Canvas 2D so this should not occur in the slice.
- Zero results (search/filter): says what was searched and offers to clear filters.

### 10.9 Review gate for every UI change
Run the 20-ban checklist (section 6), then Impeccable `critique`/`audit` on the changed surface, then look at it in a browser at 360, 768 and 1280 widths. A UI change is not done until all three have happened.
