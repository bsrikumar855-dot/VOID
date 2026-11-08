# Product

<!-- impeccable:product-schema 1 -->

Written from confirmed owner statements (master spec `docs/VOID-MASTER-SPEC.md`, office-hours answers D1 to D3 recorded in `docs/decisions/0001-*.md`). Nothing here is invented; undecided facts are marked.

## Platform

web

## Stack

Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS 4, Zod, Vitest, Playwright. Chosen by the owner's spec (§13) and verified against the registry at scaffold time. Supabase arrives with accounts (milestone M7), not before.

## Users

Developers, students, engineers, designers, founders, AI enthusiasts and curious people (spec header). The first audience that matters is learners and builders who want to understand a concept by changing it, and creators who would share what they made.

## Product Purpose

VOID makes technology something people experience, not only read about: interactive, explorable experiments that can be changed, shared as a link and (later) remixed. Success, in the owner's words: people discover something interesting, interact with it, share it and return. It is an open-source, community-driven project; no subscriptions or revenue optimisation at this stage.

## Positioning

Experiments are parameterised, shareable and remixable on one common engine, in the open: a link reproduces the exact state (settings and data) someone else saw. Visualisers that explain well rarely let you share and remix; creative-code sites that share and remix rarely explain engineering concepts rigorously. VOID joins the two.

## Operating Context

People open a link or the homepage, interact with a live experiment in the browser, change settings, copy the link and send it. Contributors add an experiment by creating one folder and one registry line (`CONTRIBUTING.md`). Work is planned and tracked in `docs/` (roadmap, ADRs, implementation status) and by the owner's AUTO-BUILDER workflow in `docs/auto-builder/`.

## Capabilities and Constraints

Built and verified (see `docs/implementation-status.md`): the Algorithm Arena (four sorting algorithms, two-algorithm race, operation counters), fragment-based share links, an experiment registry and contract, homepage with a live hero, Explore, dark and light themes.
Not built (must not be implied anywhere in the UI): neural network playground, traffic simulator, agent arena, codebase x-ray, other labs, accounts, publishing, remixing, community, challenges, terminal.
Constraints: no fake statistics, activity, users or AI output; simulated data labelled as simulated; demo output never presented as real AI; WCAG 2.1 AA target; no deployment without the owner's authorisation.
Undecided: deploy target and domain; AI providers and budget; analytics approach; editorial serif; whether Impeccable's launcher may download its binary.

## Brand Commitments

Name VOID. Tagline "The interactive universe of technology." Hero headline "THE WEB IS YOUR PLAYGROUND." with the owner's supporting copy and CTAs "ENTER THE LAB" and "EXPLORE EXPERIMENTS" (spec §12). Palette and type are pinned by the spec (§11): background #090B10, surface #11151E, raised #171D29, accents #8B9DFF and #A1F0C4, text #F1F3F8 and #929BAC, border #252C39; Geist Sans and Geist Mono. The anti-AI-slop rules (spec §11) are binding.

## Evidence on Hand

No users, testimonials, metrics, press or community content exist. Future work must not fabricate any. The only real content is the experiments themselves and their recorded operation counts.

## Product Principles

1. Real over decorative: visuals show what the code actually computes.
2. The link is the product: a shared URL must reproduce the exact experiment.
3. Honest by default: say what is simulated, demo, inferred or not built yet.
4. Depth before breadth: a few excellent experiments beat many placeholders.
5. Open by design: adding an experiment should be one folder and one line.

## Accessibility & Inclusion

WCAG 2.1 AA target. Keyboard operable throughout, visible focus, text alternatives for canvases, `prefers-reduced-motion` respected (no autoplay), contrast measured by test, touch targets of 44px, content usable at 360px width.
