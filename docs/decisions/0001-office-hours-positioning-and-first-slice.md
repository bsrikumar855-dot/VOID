# 0001 — Positioning, wedge and first vertical slice

- Date: 2026-11-08
- Status: Accepted by owner (D1–D3 in `/office-hours`)
- Source: `docs/designs/void-vertical-slice.md`
- Supersedes: nothing. Amends the milestone *order* in master spec §19 (content unchanged).

## Decision

1. **Mode:** open-source, community-driven platform. No subscription or revenue optimisation now.
2. **Wedge:** depth plus remixability on one engine, not breadth of 30+ modules.
3. **Growth loop:** a link that reproduces exact experiment state (config + seed). Works without backend or account.
4. **Community features** (accounts, comments, moderation, challenges — spec M7–M8) start only after share links are demonstrably opened and remixed.
5. **Homepage** sections are backed by the real experiment registry. Sections that need data that does not exist (community creations, featured creators, trending) are honest early states or omitted. This resolves a conflict inside the spec between §12 (those sections) and §11 rules 8–10 (no fake stats, activity or empty destinations).
6. **Hero** is a small working experiment, not decoration.
7. **Contribution-ready architecture:** one folder per experiment (manifest + module), `CONTRIBUTING.md`, and a documented "add an experiment" path.
8. **Order (amends spec §19):** M0 → M1 shell → engine (M3-lite) + first experiment → homepage alongside it → remaining labs → creator platform → community → hardening.

## First vertical slice (owner-defined)

Distinctive homepage · working experiment registry · one complete interactive experiment · reusable experiment interface · configuration serialization · working shareable experiment URL.

## Why

- Spec §11 forbids fake activity and empty destinations, so a homepage built before any experiment exists would break the spec's own rules.
- A pure deterministic engine core makes the spec's "tests verify the math" requirement achievable from day one.
- Moderation and accounts are a heavy maintenance load for an open-source maintainer; evidence should gate that cost.

## Consequences

- `docs/roadmap.md` reorders milestones M2/M3; the master spec text is not edited.
- Each milestone is independently testable and delivers working functionality.
- The first experiment (recommended: Algorithm Arena) is confirmed in `/plan-eng-review`.

## Not done / caveats

- Landscape comparison (Visualgo, TensorFlow Playground, Shadertoy, CodePen, p5.js editor, Nicky Case explorables) is from model knowledge; no web search was run.
- The office-hours independent spec-review step and optional cross-model second opinion were not run; engineering and design plan reviews follow.
- Founder-resources/YC closing from the gstack skill was intentionally skipped (not applicable to an open-source goal).
