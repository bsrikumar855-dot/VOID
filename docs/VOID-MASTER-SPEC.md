# VOID — COMPLETE MASTER PRODUCT SPECIFICATION

> Preserved verbatim from the product owner's message. Only Markdown structure (headings, lists, code fences) has been added where the paste had lost it; wording is unchanged. Do not edit requirements here — record changes in `docs/decisions/`.

## The Interactive Universe of Technology

Project Codename: VOID
Product Category: Interactive Technology Platform
Tagline: THE INTERACTIVE UNIVERSE OF TECHNOLOGY.
Vision: Make technology something people experience, not just read about.
Audience: Everyone — developers, students, engineers, designers, founders, AI enthusiasts and curious minds.
Ambition: Production-quality, globally accessible, technically sophisticated platform.

## 0. INSTRUCTIONS TO THE ENGINEERING TEAM

You are building VOID from the ground up.

This specification is the single source of truth for product direction, functionality, architecture, experience design and quality expectations.

You have access to:

* Claude Code.
* gstack workflows.
* The existing AUTO-BUILDER development system.
* The local VOID repository.

Use these systems collaboratively.

### Execution rules

1. Inspect the existing repository before making changes.
2. Read existing AUTO-BUILDER documentation and state.
3. Preserve existing project conventions.
4. Do not overwrite existing files blindly.
5. Create all product documentation inside the repository.
6. Follow the milestone execution strategy.
7. Implement actual working functionality.
8. Test every meaningful feature.
9. Maintain implementation status.
10. Do not claim functionality exists until it has been implemented and verified.

### Documentation deliverables

Create:

* `docs/VOID-MASTER-SPEC.md`
* `docs/product-spec.md`
* `docs/architecture.md`
* `docs/design-system.md`
* `docs/security.md`
* `docs/roadmap.md`
* `docs/implementation-status.md`
* `docs/decisions/`

Preserve this complete specification in `docs/VOID-MASTER-SPEC.md`.

Do not start implementation before reading and organizing the complete specification and completing the initial planning workflow.

## 1. PRODUCT VISION

### What is VOID?

VOID is an interactive technology universe.

It combines:

* Engineering simulations.
* Interactive learning.
* AI experimentation.
* Developer utilities.
* Creative coding.
* Digital art.
* Technical visualization.
* Community-driven creations.

It should feel like entering a digital world where everything is explorable.

VOID is not:

* Another SaaS dashboard.
* Another AI chatbot.
* Another static developer portfolio.
* Another collection of links.
* Another generic tool directory.

It is an interconnected platform where users discover, experiment, understand, build, publish and share.

### Core philosophy

"Don't just consume technology. Interact with it."

### Core user journey

DISCOVER → EXPLORE → EXPERIMENT → UNDERSTAND → BUILD → SHARE → REMIX → RETURN.

### Product goals

1. Make visitors immediately curious.
2. Deliver real interactive experiences.
3. Make difficult technical concepts understandable.
4. Provide useful developer tools.
5. Enable users to create and share experiments.
6. Build a community around technology.
7. Encourage meaningful repeat usage.
8. Establish a distinctive visual identity.

## 2. PRODUCT PILLARS

VOID consists of six interconnected pillars.

* **EXPLORE** — Discover interesting technology, simulations, experiments and creations.
* **EXPERIMENT** — Manipulate systems, change parameters and observe real results.
* **UNDERSTAND** — Learn how algorithms, networks, AI and engineering systems work.
* **BUILD** — Create customized experiences and interactive configurations.
* **SHARE** — Publish experiments and share reproducible links.
* **CONNECT** — Discover creators, participate in challenges and remix community creations.

Every feature should support at least one of these pillars.

## 3. INFORMATION ARCHITECTURE

Implement the following platform structure.

### HOME

The main discovery experience.

Sections:

* Immersive hero.
* Featured experiments.
* Live experiments.
* Daily discovery.
* Trending categories.
* Recently published creations.
* Explore by technology.
* Community highlights.
* Featured creators.

### LABS

Interactive scientific and engineering experiences.

Subsections:

* Neural Network Playground.
* Algorithm Arena.
* Glitch Lab.
* Physics Lab.
* Logic Lab.
* Cryptography Lab.
* Data Structure Lab.
* Quantum Playground.

### SYSTEMS

Understand how real computing systems operate.

Subsections:

* Internet Traffic Simulator.
* Database Visualizer.
* Operating System Simulator.
* Distributed Systems.
* Networking Lab.
* Memory Visualization.

### AI ARENA

An interactive AI experimentation environment.

Subsections:

* Multi-agent workflows.
* Agent orchestration.
* Model experiments.
* AI evaluation.
* Prompt experimentation.
* Agent collaboration.

### DEVELOPER TOOLS

Useful technical utilities.

Subsections:

* Codebase X-Ray.
* API Playground.
* JSON tools.
* Regex Playground.
* Color Lab.
* SVG Studio.
* Developer utilities.

### BUILD

A creation environment.

Features:

* Experiment configuration.
* Customization.
* Preview.
* Save.
* Version.
* Publish.
* Share.
* Remix.

### COMMUNITY

A place to discover and share creations.

Features:

* Creator profiles.
* Public experiments.
* Bookmarks.
* Likes.
* Comments.
* Challenges.
* Remix history.
* Reporting and moderation.

### TERMINAL

Global command-driven navigation.

### PROFILE

User preferences, saved work, creations and account settings.

Do not expose every section in the primary navigation simultaneously. Use a thoughtful information hierarchy.

## 4. SIGNATURE EXPERIENCE SPECIFICATIONS

These are the most important features in VOID.

Each must be implemented as a genuinely interactive experience.

### 4.1 NEURAL NETWORK PLAYGROUND

**Objective**

Make neural networks visually understandable.

**Features**

* Interactive neural network canvas.
* Add and remove layers.
* Configure neuron counts.
* Connect neurons.
* Adjustable weights and biases.
* Activation functions.
* Forward propagation.
* Training visualization.
* Dataset selection.
* Prediction output.
* Reset and replay.
* Step-by-step explanations.

**Visualization**

Display:

* Neuron nodes.
* Connections.
* Connection weights.
* Activation values.
* Input and output layers.
* Information flow.

**Interactions**

Users must be able to modify network parameters and immediately see how outputs change.

Implement actual mathematical operations.

Verify the calculations with automated tests.

Do not use decorative animations that are disconnected from the underlying computation.

### 4.2 INTERNET TRAFFIC SIMULATOR

**Objective**

Demonstrate how requests move through a simulated network.

**Components**

* Clients.
* Routers.
* Load balancers.
* Servers.
* Network links.
* Request packets.

**Features**

* Generate traffic.
* Visualize packets.
* Configure latency.
* Configure packet loss.
* Simulate server failures.
* Simulate recovery.
* Configure server capacity.
* Compare routing algorithms.
* Display request statistics.

**Algorithms**

Implement:

* Round Robin.
* Least Connections.

**Metrics**

* Requests processed.
* Requests failed.
* Average latency.
* Packet loss.
* Server utilization.
* Distribution of requests.

Allow users to deliberately break the simulated system and observe its recovery.

Clearly distinguish simulated metrics from real infrastructure monitoring.

### 4.3 AI AGENT ARENA

**Objective**

Let users understand and experiment with multi-agent systems.

**Default agent roles**

1. Research Agent.
2. Architect Agent.
3. Developer Agent.
4. Reviewer Agent.
5. Security Agent.

**Features**

* Task input.
* Agent configuration.
* Workflow orchestration.
* Agent status.
* Execution timeline.
* Inter-agent communication.
* Streaming results.
* Final response aggregation.
* Cancellation.
* Error handling.
* Execution budgets.
* Run history.

**Visualization**

Show agents as nodes in an interactive workflow.

Represent:

* Pending.
* Running.
* Completed.
* Failed.
* Waiting.

Display real execution state.

**AI integration**

Use model providers through secure server-side integrations.

Provide a deterministic demo mode when credentials are unavailable.

Never represent deterministic mock output as real AI execution.

### 4.4 CODEBASE X-RAY

**Objective**

Transform public GitHub repositories into understandable architecture visualizations.

**Input**

A validated public GitHub repository URL.

**Features**

* Repository metadata.
* File tree.
* Language distribution.
* Dependency analysis.
* Architecture map.
* Component relationships.
* Import graph.
* API route identification where statically detectable.
* Complexity indicators.
* Technology stack breakdown.

**Visualizations**

* Interactive dependency graph.
* Directory hierarchy.
* Architecture overview.
* Component relationships.

**Requirements**

* Never execute repository code.
* Never expose private repository contents.
* Validate every repository URL.
* Prevent SSRF.
* Validate redirects and resolved IP addresses.
* Restrict resource consumption.
* Handle large repositories gracefully.
* Treat repository contents as untrusted data.

Clearly communicate what is inferred and what is directly detected.

### 4.5 ALGORITHM ARENA

**Objective**

Make algorithms visual and interactive.

**Algorithms**

Sorting:

* Bubble Sort.
* Selection Sort.
* Insertion Sort.
* Merge Sort.
* Quick Sort.

Searching:

* Linear Search.
* Binary Search.

Graphs:

* BFS.
* DFS.
* Dijkstra.

Data structures:

* Heap operations.
* Binary search trees.
* Tree traversal.

Scheduling:

* FCFS.
* SJF.
* Round Robin.
* Priority Scheduling.

**Features**

* Input customization.
* Step-by-step execution.
* Speed controls.
* Pause.
* Resume.
* Reset.
* Side-by-side comparison.
* Operation counters.
* Complexity explanations.

The visualization must represent the actual algorithm state.

Users should be able to compare how two algorithms process the same dataset.

### 4.6 GLITCH LAB

**Objective**

Create a visually extraordinary creative coding playground.

**Experiences**

* Particle physics.
* Procedural geometry.
* Generative art.
* Fluid-like simulations.
* Mouse-controlled particle fields.
* Interactive patterns.
* Audio-reactive visualizations.
* Noise-based landscapes.
* Dynamic visual compositions.

**Controls**

* Particle count.
* Speed.
* Gravity.
* Attraction.
* Repulsion.
* Color parameters.
* Shape parameters.
* Interaction strength.

**Features**

* Live customization.
* Reset.
* Randomize.
* Save configuration.
* Share configuration.
* Export generated images where appropriate.

Use WebGL when beneficial.

Provide fallback rendering where possible.

Respect reduced-motion preferences.

## 5. ADDITIONAL EXPERIENCE MODULES

Expand the platform with the following.

### Database Visualizer

* Tables.
* Relationships.
* Query execution demonstrations.
* Indexing.
* Transactions.
* Query plans.
* B-tree visualization.

### Operating System Simulator

* Processes.
* Threads.
* CPU scheduling.
* Memory allocation.
* Page replacement.
* Deadlocks.

### Cryptography Lab

* Hashing.
* Encoding.
* Encryption demonstrations.
* Decryption demonstrations.
* Key concepts.
* Educational attack demonstrations.

Clearly distinguish educational demonstrations from production cryptographic implementations.

### API Playground

* HTTP methods.
* Headers.
* Request body.
* Response viewer.
* Status codes.
* Timing.
* Error visualization.

Use safe request policies and prevent access to internal services.

### Regex Playground

* Pattern editor.
* Live matching.
* Highlighted results.
* Explanations.
* Test cases.

### Data Structure Lab

* Stack.
* Queue.
* Linked list.
* Trees.
* Graphs.
* Heaps.
* Hash tables.

### Color Lab

* Color picker.
* Palette generator.
* Contrast checker.
* Color conversion.
* Accessibility evaluation.

### SVG Studio

* SVG creation.
* Shapes.
* Paths.
* Transformation.
* Preview.
* Export.

### Logic Lab

* Boolean operations.
* Truth tables.
* Logic gates.
* Circuit simulation.

### Quantum Playground

* Educational quantum circuits.
* Qubit state visualization.
* Gates.
* Measurement.
* State simulation.

These are expandable modules. Build them progressively instead of generating incomplete placeholder pages.

## 6. EXPERIMENT ENGINE

This is the central technical abstraction.

Do not implement experiments as disconnected pages with duplicated logic.

Create a reusable experiment framework.

Each experiment must provide:

* Unique ID.
* Slug.
* Title.
* Description.
* Category.
* Tags.
* Version.
* Configuration schema.
* Default configuration.
* Initialization.
* Execution lifecycle.
* Pause and resume.
* Reset.
* Cleanup.
* State serialization.
* State restoration.
* Error handling.
* Resource management.

**Core lifecycle**

REGISTER → LOAD → INITIALIZE → RUN → PAUSE → RESET → CLEANUP.

**Requirements**

* Experiment registry.
* Lazy loading.
* Error boundaries.
* Configuration validation.
* Resource cleanup.
* Isolation between experiments.
* Deterministic behavior where applicable.
* Performance measurement.
* Accessible controls.

The experiment framework must be extensible without modifying unrelated modules.

## 7. CREATION AND REMIX ENGINE

Users must be able to create personalized versions of experiments.

**User workflow**

1. Open an experiment.
2. Modify parameters.
3. Preview changes.
4. Save the configuration.
5. Publish a version.
6. Generate a unique share URL.
7. Share with others.
8. Allow other users to remix it.

**Requirements**

* Configuration serialization.
* Schema validation.
* Versioning.
* Public and private visibility.
* Attribution.
* Remix relationships.
* Configuration restoration.
* Error handling for invalid configurations.

Shared URLs must reproduce the intended experiment state.

## 8. DISCOVERY ENGINE

Build an actual discovery system.

**Discovery sections**

* Featured.
* Trending.
* Recently published.
* Most remixed.
* Editor's picks.
* Daily discovery.
* Categories.
* Recommended.

**Search**

Search:

* Experiment titles.
* Descriptions.
* Categories.
* Tags.
* Creators.

**Filtering**

Support useful filters and sorting.

Do not invent popularity data.

Recommendations should be explainable and based on actual available signals.

## 9. COMMUNITY SYSTEM

**Features**

* User profiles.
* Creator pages.
* Published experiments.
* Likes.
* Bookmarks.
* Comments.
* Remixing.
* Challenges.
* Submissions.
* Reporting.
* Moderation.

**Challenges**

Provide weekly engineering challenges.

Examples:

* Build the fastest sorting visualization.
* Create an interesting particle simulation.
* Design a network routing experiment.
* Build a creative neural network.

Challenge evaluation must use transparent criteria.

Avoid manipulative gamification.

## 10. VOID TERMINAL

Build a global terminal-style command interface.

**Example commands**

```
help
explore
labs
systems
arena
build
discover
profile
settings
theme dark
theme light
```

**Requirements**

* Keyboard shortcuts.
* Autocomplete.
* Command history.
* Command registry.
* Validation.
* Accessible interactions.
* Navigation integration.
* Contextual commands.
* Helpful error messages.

The terminal must execute real application actions.

Do not create a fake terminal that simply displays scripted responses.

Include tasteful Easter eggs.

## 11. VISUAL DESIGN SYSTEM

### Art direction

VOID should feel like a sophisticated digital universe combining:

* Experimental web design.
* Scientific visualization.
* Creative coding.
* Editorial typography.
* Technical interfaces.
* Spatial composition.
* Minimalism.

The visual design must be recognizable as VOID.

### Color system

* Background: #090B10
* Surface: #11151E
* Elevated surface: #171D29
* Primary accent: #8B9DFF
* Secondary accent: #A1F0C4
* Main text: #F1F3F8
* Muted text: #929BAC
* Border: #252C39

Use semantic design tokens.

### Typography

* Geist Sans.
* Geist Mono.
* Optional editorial serif for selected storytelling sections.

### Motion

Use:

* GSAP.
* Motion.
* Three.js.
* React Three Fiber.
* Canvas.

Animations must have a functional or storytelling purpose.

Implement:

* Meaningful transitions.
* Interactive depth.
* Controlled particle movement.
* State transitions.
* Hover feedback.
* Loading transitions.
* Reduced-motion alternatives.

### ANTI-AI-SLOP DESIGN RULES

Absolutely avoid:

1. Generic AI startup landing pages.
2. Excessive gradients.
3. Generic glassmorphism.
4. Identical cards everywhere.
5. Random floating decorative objects.
6. Unnecessary glowing borders.
7. Excessive rounded containers.
8. Fake statistics.
9. Fake user activity.
10. Empty navigation destinations.
11. Decorative buttons with no actions.
12. Excessive animation.
13. Unnecessary scroll hijacking.
14. Repetitive section layouts.
15. Generic marketing language.
16. Inconsistent typography.
17. Random visual effects.
18. Poor mobile layouts.
19. Unnecessary dependencies.
20. Fake AI functionality.

Every page must have deliberate visual composition.

Every interaction must provide understandable feedback.

Every experience must look and behave like a complete product.

Do not settle for component-library defaults.

## 12. HOMEPAGE SPECIFICATION

The homepage is the most important acquisition surface.

It must immediately communicate what VOID is.

### Hero

Primary headline:

THE WEB IS YOUR PLAYGROUND.

Supporting statement:

Don't just browse technology. Interact with it.
Explore systems. Break things. Build experiments. Share discoveries.

Primary CTA:

ENTER THE LAB

Secondary CTA:

EXPLORE EXPERIMENTS

### Hero visual

Create a distinctive interactive visual environment.

Possible elements:

* Particle systems.
* Spatial grids.
* Interactive node networks.
* Generative geometry.
* Subtle pointer response.

The visual must be performant and responsive.

It should not prevent the headline and navigation from remaining readable.

### Homepage sections

1. Hero.
2. Live experiments.
3. Featured labs.
4. Systems.
5. AI experiences.
6. Developer tools.
7. Community creations.
8. Daily discovery.
9. Call to explore.
10. Footer.

Use varied editorial compositions rather than repeating the same card grid.

## 13. TECHNICAL STACK

Use latest stable compatible releases.

**Frontend**

* Next.js App Router.
* React.
* TypeScript strict mode.
* Tailwind CSS.
* shadcn/ui.

**Graphics**

* Three.js.
* React Three Fiber.
* GSAP.
* Motion.
* D3.js.
* Canvas.
* WebGL.

**Backend**

* Supabase.
* PostgreSQL.
* Supabase Auth.
* Supabase Storage.
* Next.js Route Handlers.

**Supporting libraries**

* Zod.
* Zustand where justified.
* React Hook Form.
* Vitest.
* Playwright.
* ESLint.
* Prettier.

Avoid dependency duplication.

Use Server Components by default.

Use Client Components only where necessary.

Lazy-load heavy visual experiences.

## 14. REPOSITORY ARCHITECTURE

Recommended structure:

```
void/
├── public/
│   ├── assets/
│   ├── textures/
│   └── icons/
│
├── src/
│   ├── app/
│   │   ├── (marketing)/
│   │   ├── (platform)/
│   │   │   ├── explore/
│   │   │   ├── labs/
│   │   │   ├── systems/
│   │   │   ├── arena/
│   │   │   ├── build/
│   │   │   ├── tools/
│   │   │   ├── community/
│   │   │   └── profile/
│   │   ├── experiments/
│   │   │   └── [slug]/
│   │   ├── api/
│   │   └── layout.tsx
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── navigation/
│   │   ├── terminal/
│   │   ├── visualization/
│   │   └── shared/
│   │
│   ├── features/
│   │   ├── experiments/
│   │   ├── algorithms/
│   │   ├── neural-network/
│   │   ├── traffic-simulator/
│   │   ├── agent-arena/
│   │   ├── codebase-xray/
│   │   ├── glitch-lab/
│   │   ├── discovery/
│   │   └── community/
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   ├── validation/
│   │   ├── security/
│   │   └── utils/
│   │
│   ├── hooks/
│   ├── stores/
│   ├── types/
│   └── config/
│
├── supabase/
│   ├── migrations/
│   └── seed.sql
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docs/
│   ├── VOID-MASTER-SPEC.md
│   ├── product-spec.md
│   ├── architecture.md
│   ├── design-system.md
│   ├── security.md
│   ├── roadmap.md
│   ├── implementation-status.md
│   └── decisions/
│
└── README.md
```

Adapt this structure to the actual repository rather than forcing unnecessary directories.

## 15. DATABASE DESIGN

Use Supabase PostgreSQL.

**Core tables:**

* profiles
* experiments
* experiment_versions
* experiment_configurations
* experiment_runs
* categories
* tags
* bookmarks
* likes
* comments
* remixes
* challenges
* challenge_submissions
* reports
* notifications

**Database requirements**

* Appropriate foreign keys.
* Constraints.
* Indexes.
* Timestamps.
* Ownership relationships.
* Visibility settings.
* Version relationships.
* Auditability where appropriate.

**Security**

Use Row Level Security for user-owned records.

Test policies for:

* Anonymous users.
* Authenticated users.
* Content owners.
* Other users.
* Administrative moderation roles.

Never rely on client-side authorization alone.

Never expose privileged Supabase keys in browser code.

## 16. SECURITY SPECIFICATION

Security is mandatory.

**Authentication**

* Secure session handling.
* Server-side verification.
* Protected routes.
* Authorization checks.
* Least privilege.

**User content**

* Input validation.
* Output sanitization.
* XSS prevention.
* Rate limiting.
* Safe rendering.
* Visibility enforcement.

**Experiment execution**

Never execute arbitrary user-provided JavaScript inside the main application context.

Use appropriately sandboxed execution environments for custom code functionality.

Enforce resource limits.

**GitHub integration**

* Validate repository URLs.
* Prevent SSRF.
* Validate redirects.
* Block loopback and private network destinations.
* Block cloud metadata endpoints.
* Apply request and processing limits.
* Never execute repository code.
* Protect credentials.

**AI integration**

* Protect API keys.
* Handle prompt injection.
* Restrict tool permissions.
* Treat model output as untrusted.
* Enforce execution budgets.
* Apply timeouts.
* Audit tool usage.

**API security**

* Input validation.
* Authentication where required.
* Authorization.
* Rate limiting.
* Safe error messages.
* Request limits.

**Operational security**

* Secret scanning.
* Dependency auditing.
* Secure environment configuration.
* Security headers.
* Secure logging.
* No secrets in source control.

Create a documented threat model.

## 17. PERFORMANCE SPECIFICATION

VOID contains computationally expensive experiences.

Optimize carefully.

Requirements:

* Lazy loading.
* Dynamic imports.
* Code splitting.
* Efficient rendering.
* Animation cleanup.
* Resource disposal.
* Web Workers where justified.
* Image optimization.
* Reduced-motion support.
* CPU and memory limits.
* Device-aware rendering.

Do not load every visualization on the homepage.

Do not initialize heavy WebGL scenes unnecessarily.

Target:

* Lighthouse Performance 90+ on representative routes.
* Lighthouse Accessibility 95+.
* Good Core Web Vitals.
* Responsive interaction.
* Graceful WebGL fallback.

These are targets to measure, not achievements to assume.

## 18. ACCESSIBILITY

Target WCAG 2.1 AA.

Implement:

* Semantic HTML.
* Keyboard navigation.
* Focus management.
* Screen-reader support.
* Contrast compliance.
* Accessible controls.
* Accessible dialogs.
* Reduced motion.
* Error announcements.
* Touch-friendly interactions.

Critical interactions must not depend exclusively on mouse input or color.

## 19. DEVELOPMENT MILESTONES

Build progressively.

### M0 — FOUNDATION AND DISCOVERY

* Repository audit.
* Existing project analysis.
* Architecture decisions.
* Product specification.
* Design specification.
* Security plan.
* Development roadmap.

Exit criteria: reviewed architecture and clear execution plan.

### M1 — APPLICATION FOUNDATION

* Next.js setup.
* TypeScript.
* Tailwind.
* Design tokens.
* Component foundation.
* Application layout.
* Navigation.
* Responsive shell.
* Theme infrastructure.

Exit criteria: stable working application shell.

### M2 — HOMEPAGE AND DESIGN IDENTITY

* Immersive hero.
* Homepage composition.
* Navigation.
* Discovery sections.
* Responsive layouts.
* Motion.
* Terminal interface.

Exit criteria: fully functional, polished homepage.

### M3 — EXPERIMENT ENGINE

* Experiment registry.
* Lifecycle.
* Configuration.
* Serialization.
* Validation.
* Resource cleanup.
* Lazy loading.

Exit criteria: reusable framework verified by tests.

### M4 — SIGNATURE LABS

* Neural Network Playground.
* Algorithm Arena.
* Glitch Lab.

Exit criteria: three fully working experiences.

### M5 — SYSTEMS

* Internet Traffic Simulator.
* Database Visualizer.
* OS Simulator.
* Cryptography Lab.

Exit criteria: functional technical simulations.

### M6 — AI AND DEVELOPER TOOLS

* AI Agent Arena.
* Codebase X-Ray.
* API Playground.
* Developer utilities.

Exit criteria: secure, tested integrations.

### M7 — CREATOR PLATFORM

* Authentication.
* Profiles.
* Save.
* Publish.
* Versioning.
* Sharing.
* Remixing.

Exit criteria: reproducible shared experiments.

### M8 — COMMUNITY

* Discovery.
* Bookmarks.
* Likes.
* Comments.
* Challenges.
* Moderation.

Exit criteria: protected community functionality.

### M9 — PRODUCTION HARDENING

* Security review.
* Accessibility review.
* Performance review.
* Cross-browser testing.
* Regression testing.
* Deployment readiness.

Exit criteria: all critical acceptance requirements verified.

## 20. QUALITY ASSURANCE

Use:

* Vitest.
* Playwright.
* TypeScript checks.
* ESLint.
* Integration tests.
* Browser testing.

**Unit testing**

Test:

* Algorithms.
* Mathematical operations.
* Simulations.
* Configuration validation.
* Serialization.
* State transitions.

**Integration testing**

Test:

* Experiment registry.
* Authentication.
* Authorization.
* Database operations.
* Save.
* Publish.
* Share.
* Remix.

**End-to-end testing**

Test:

* Homepage.
* Navigation.
* Search.
* Terminal.
* Experiments.
* Configuration.
* User authentication.
* Publishing.
* Shared URLs.
* Remixing.
* Mobile navigation.

**Definition of done**

A feature is complete only when:

* It works.
* Its expected behavior is tested.
* It handles errors.
* It is responsive.
* It is accessible.
* It meets security requirements.
* It has no known critical regressions.

Never fabricate test results.

Never silently ignore failing tests.

## 21. GSTACK WORKFLOW

Use gstack as the structured product and engineering review layer.

Recommended sequence:

1. `/office-hours` — challenge the product and refine its positioning.
2. `/plan-eng-review` — review architecture and engineering decisions.
3. `/plan-design-review` — establish the visual and UX direction.
4. `/review` — inspect changes for technical problems.
5. `/qa` — test actual application behavior in a browser.
6. `/ship` — prepare verified work for release.

Use other installed gstack workflows when they materially help.

Check the installed gstack version and actual skill availability before invoking commands.

Do not assume a command exists if it is absent from the installed version.

### AUTO-BUILDER coordination

AUTO-BUILDER remains the implementation autonomy system.

gstack provides planning, review, QA and release workflows.

Claude Code coordinates both.

Do not create competing autonomous loops.

Inspect existing AUTO-BUILDER state and respect its rules.

Preserve:

* Existing task state.
* Decisions.
* Hooks.
* Agents.
* Security checks.
* Implementation conventions.

Keep `docs/implementation-status.md` synchronized.

Ask before destructive actions and production pushes.

## 22. RELEASE AND DEPLOYMENT

Recommended deployment:

* Vercel.
* Supabase.
* GitHub Actions.
* Sentry or equivalent monitoring.

Implement:

* Environment validation.
* Production build checks.
* Database migration strategy.
* Secure environment variables.
* Error monitoring.
* Deployment documentation.
* Rollback considerations.

Do not deploy publicly without authorization.

## 23. FINAL ACCEPTANCE CRITERIA

VOID must satisfy all of the following before being called production-ready:

1. Distinctive visual identity.
2. Fully functional responsive homepage.
3. Consistent application navigation.
4. Working global terminal.
5. Reusable experiment framework.
6. Genuine interactive signature experiences.
7. Correct simulations and algorithms.
8. Secure GitHub repository analysis.
9. Real AI integrations when configured.
10. Deterministic demo modes when integrations are unavailable.
11. Authentication and authorization.
12. Save and publish.
13. Shareable configurations.
14. Remix attribution.
15. Community functionality.
16. Database security.
17. Accessible interactions.
18. Performance optimization.
19. Automated testing.
20. Production deployment readiness.
21. Complete technical documentation.

No fake features.

No fabricated metrics.

No empty pages presented as finished.

No false claims of security or production readiness.

## 24. PRODUCT SUCCESS METRICS

Measure real product engagement.

Primary metrics:

* First experiment interaction rate.
* Experiment completion rate.
* Returning users.
* Weekly active users.
* Experiments created.
* Experiments published.
* Share-link visits.
* Remix rate.
* Community participation.
* Feature adoption.

The most important metric:

How many people discover something interesting, interact with it, share it and return to VOID?

Optimize the product around genuine value, not vanity metrics.

## 25. FINAL ENGINEERING DIRECTIVE

Think like a product founder.

Architect like a principal engineer.

Design like an award-winning digital studio.

Build like a creative technologist.

Review like a security engineer.

Test like a professional QA organization.

Every experience must have real functionality.

Every page must have deliberate art direction.

Every interaction must feel intentional.

Every technical claim must be verifiable.

Make sophisticated technology approachable without oversimplifying it.

Make the platform memorable without sacrificing usability.

Make VOID worth returning to.

VOID IS NOT ANOTHER WEBSITE. IT IS AN INTERACTIVE UNIVERSE.

Start by auditing the repository, reading existing AUTO-BUILDER state, creating the documentation structure and executing the gstack planning workflow.

After the planning checkpoint, begin implementation milestone by milestone.

Do not stop at planning.

BUILD VOID.
