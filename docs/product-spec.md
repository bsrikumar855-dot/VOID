# VOID — Product Specification (organized extract)

Source of truth: [`VOID-MASTER-SPEC.md`](./VOID-MASTER-SPEC.md). This file reorganizes its requirements into a checkable form. If the two disagree, the master spec wins and this file is wrong — fix it. Section numbers (§) refer to the master spec. Nothing here is implemented unless `implementation-status.md` says it is verified.

## 1. Product in one paragraph

VOID is an interactive technology universe: engineering simulations, interactive learning, AI experimentation, developer utilities, creative coding and community-made experiments in one explorable platform (§1). Core loop: DISCOVER → EXPLORE → EXPERIMENT → UNDERSTAND → BUILD → SHARE → REMIX → RETURN. It is explicitly not a SaaS dashboard, an AI chatbot, a static portfolio, a link collection or a tool directory.

## 2. Pillars (§2)

EXPLORE · EXPERIMENT · UNDERSTAND · BUILD · SHARE · CONNECT. **Rule:** every feature must support at least one pillar. Record the pillar(s) for each experiment in its manifest.

## 3. Information architecture (§3)

| Area | Contains | Notes |
|---|---|---|
| HOME | Hero, featured, live experiments, daily discovery, trending categories, recent, explore by technology, community highlights, featured creators | Acquisition surface (§12) |
| LABS | Neural Network Playground, Algorithm Arena, Glitch Lab, Physics Lab, Logic Lab, Cryptography Lab, Data Structure Lab, Quantum Playground | |
| SYSTEMS | Internet Traffic Simulator, Database Visualizer, OS Simulator, Distributed Systems, Networking Lab, Memory Visualization | |
| AI ARENA | Multi-agent workflows, orchestration, model experiments, AI evaluation, prompt experimentation, agent collaboration | |
| DEVELOPER TOOLS | Codebase X-Ray, API Playground, JSON tools, Regex Playground, Color Lab, SVG Studio, utilities | |
| BUILD | Configure, customize, preview, save, version, publish, share, remix | |
| COMMUNITY | Profiles, public experiments, bookmarks, likes, comments, challenges, remix history, reporting/moderation | |
| TERMINAL | Global command navigation | |
| PROFILE | Preferences, saved work, creations, account | |

**IA rules:** do not expose every section in primary navigation at once (§3). No empty navigation destinations (§11 rule 10) — a section appears in navigation only when it contains at least one working experience or a real, honest "coming" state that is not presented as finished.

## 4. Requirements by area

IDs are stable; use them in tests and `implementation-status.md`.

### 4.1 Signature experiences (§4) — each must be genuinely interactive

| ID | Experience | Must have | Verification notes |
|---|---|---|---|
| SIG-NN | Neural Network Playground | Add/remove layers, neuron counts, editable weights/biases, activation functions, forward propagation, training visualization, datasets, prediction output, reset/replay, step-by-step explanation. Real math. | Unit-test forward pass and training against hand-computed values. No decorative animation disconnected from computation. |
| SIG-NET | Internet Traffic Simulator | Clients, routers, load balancers, servers, links, packets; traffic generation; latency, loss, capacity config; failure + recovery; Round Robin and Least Connections; metrics (processed, failed, avg latency, loss, utilization, distribution). | Deterministic seeded simulation tested. Label metrics as *simulated*, never as real infrastructure monitoring. |
| SIG-AI | AI Agent Arena | Roles: Research, Architect, Developer, Reviewer, Security. Task input, agent config, orchestration, status (pending/running/completed/failed/waiting), timeline, inter-agent messages, streaming, aggregation, cancellation, error handling, budgets, run history. Server-side provider calls. **Deterministic demo mode when no credentials; mock output must never be presented as real AI.** | Test state machine, cancellation, budget enforcement. Demo mode visibly labelled. |
| SIG-XRAY | Codebase X-Ray | Public GitHub URL in; metadata, file tree, language distribution, dependency analysis, architecture map, import graph, statically detectable API routes, complexity indicators, stack breakdown. Never execute repo code; never expose private repos; SSRF-safe; resource-limited. Distinguish *inferred* from *directly detected*. | Security tests for URL validation, redirects, resolved IPs, size limits. |
| SIG-ALG | Algorithm Arena | Sorting (bubble, selection, insertion, merge, quick); searching (linear, binary); graphs (BFS, DFS, Dijkstra); heap ops, BST, traversals; scheduling (FCFS, SJF, RR, priority). Custom input, step/speed/pause/resume/reset, side-by-side comparison, operation counters, complexity notes. Visualization reflects actual algorithm state. | Unit-test every algorithm for correctness and step traces. |
| SIG-GLITCH | Glitch Lab | Particle physics, procedural geometry, generative art, fluid-like sims, pointer-driven fields, patterns, audio-reactive, noise landscapes. Controls: count, speed, gravity, attraction, repulsion, color, shape, interaction strength. Randomize, reset, save/share config, image export. WebGL where beneficial with fallback. Reduced-motion respected. | Config round-trip tests; reduced-motion test; fallback test. |

### 4.2 Additional modules (§5) — build progressively, no placeholder pages

Database Visualizer · OS Simulator · Cryptography Lab (educational, labelled as not production crypto) · API Playground (safe request policy, no internal-service access) · Regex Playground · Data Structure Lab · Color Lab · SVG Studio · Logic Lab · Quantum Playground. Feature lists per §5.

### 4.3 Experiment engine (§6) — central abstraction

Every experiment provides: id, slug, title, description, category, tags, version, config schema, default config, init, lifecycle, pause/resume, reset, cleanup, serialize, restore, error handling, resource management. Lifecycle: **REGISTER → LOAD → INITIALIZE → RUN → PAUSE → RESET → CLEANUP.** Requirements: registry, lazy loading, error boundaries, config validation, resource cleanup, isolation, determinism where applicable, performance measurement, accessible controls, extensible without touching unrelated modules.

### 4.4 Creation and remix (§7)

Open → modify → preview → save → publish a version → unique share URL → share → others remix. Needs: serialization, schema validation, versioning, public/private, attribution, remix relationships, restoration, invalid-config handling. **Shared URLs must reproduce the intended state.**

### 4.5 Discovery (§8)

Sections: featured, trending, recently published, most remixed, editor's picks, daily discovery, categories, recommended. Search over titles, descriptions, categories, tags, creators. Filters and sorting. **Never invent popularity data; recommendations must be explainable from real signals.**

### 4.6 Community (§9)

Profiles, creator pages, published experiments, likes, bookmarks, comments, remixing, challenges, submissions, reporting, moderation. Weekly challenges with transparent criteria; avoid manipulative gamification.

### 4.7 Terminal (§10)

Commands: help, explore, labs, systems, arena, build, discover, profile, settings, `theme dark|light`. Shortcuts, autocomplete, history, registry, validation, accessibility, navigation integration, contextual commands, helpful errors, tasteful Easter eggs. **Must execute real application actions — not scripted output.**

### 4.8 Homepage (§12)

Headline **THE WEB IS YOUR PLAYGROUND.** Supporting copy: "Don't just browse technology. Interact with it. / Explore systems. Break things. Build experiments. Share discoveries." CTAs: **ENTER THE LAB** (primary), **EXPLORE EXPERIMENTS** (secondary). Interactive hero visual that stays performant and never harms headline/nav legibility. Sections: hero, live experiments, featured labs, systems, AI experiences, developer tools, community creations, daily discovery, call to explore, footer — in varied editorial compositions, not one repeated card grid.

## 5. Cross-cutting requirements

Security (§16 → `security.md`), performance (§17 → `architecture.md`), accessibility WCAG 2.1 AA (§18), design (§11 → `design-system.md`), QA and definition of done (§20), deployment (§22).

**Definition of done (§20):** works · expected behaviour tested · handles errors · responsive · accessible · meets security requirements · no known critical regressions. Never fabricate test results; never silently ignore failing tests.

## 6. Final acceptance criteria (§23)

Production-ready only when all 21 hold: distinctive identity; functional responsive homepage; consistent navigation; working terminal; reusable experiment framework; genuine signature experiences; correct simulations/algorithms; secure GitHub analysis; real AI integrations when configured; deterministic demo modes otherwise; auth + authorization; save/publish; shareable configs; remix attribution; community; database security; accessible interactions; performance optimization; automated testing; deployment readiness; complete documentation. No fake features, fabricated metrics, empty pages presented as finished, or false security/production-readiness claims.

## 7. Success metrics (§24)

First-experiment interaction rate, experiment completion rate, returning users, WAU, experiments created/published, share-link visits, remix rate, community participation, feature adoption. Headline question: how many people discover something interesting, interact with it, share it and return? Instrument only real events; no vanity metrics.

## 8. Open questions for the owner

Tracked in `docs/decisions/`. Initial list: (1) deploy target and domain; (2) which AI providers/keys and budget for Agent Arena; (3) whether Supabase project exists yet (M7); (4) editorial serif choice; (5) analytics tooling for §24 metrics.
