# 0002 — Engineering review: engine contract, share URL, first experiment, stack

- Date: 2026-11-08
- Status: Accepted (lead decisions on reversible engineering matters; one item flagged for the owner)
- Source: independent critique by the `architect` agent (read-only; library behaviour is from its own knowledge and **must be verified against current docs at implementation time**), plus the lead's reading of `docs/architecture.md` and `docs/security.md`.
- Amends: `docs/architecture.md` sections 2–4, `docs/security.md` T3/T4/T13.

## Process disclosure

`/plan-eng-review` is installed but not registered as an invocable skill in this environment, and its full gated process needs many approval round trips. The review was done as: independent architect critique → lead decisions recorded here. It was **not** the gstack skill's ledger/outside-voice procedure. No cross-model (Codex) review ran. Spec §19–25 were only partly read by the reviewer.

## Decisions

### D1 Engine contract: minimal, no lifecycle state machine
Replace the draft's nine-method instance, `ctx` services and state machine with:

```ts
interface ExperimentDefinition<C> {
  meta: { id: string; slug: string; title: string; summary: string;
          category: string; tags: readonly string[]; version: number }
  configSchema: ZodType<C>            // strict; seed is a config field
  defaultConfig: C
  load(): Promise<{ mount(host: HTMLElement, o: {
        config: C; signal: AbortSignal; onChange(c: C): void }): ExperimentHandle<C> }>
}
interface ExperimentHandle<C> {
  play(): void; pause(): void; reset(): void; step(): void
  setConfig(c: C): void; destroy(): void   // destroy() idempotent; also runs on signal.abort()
}
```
- Status is a union (`idle | running | paused | done | error`) with a reducer test, not a machine.
- REGISTERED/LOADED are registry facts, not instance states.
- No `restore()`, no `serialize()` of internal state, no `ctx.worker`/`perf`/`on()`. Add `migrate(fromVersion, raw)` only when a v2 config exists.
- Pure core is separate from the adapter: `createSim(config)` yields a generator/trace; the adapter owns rAF. Visible state is a pure function of `(config, stepIndex)`; speed changes only steps per frame.
- **Why:** deep module, one way to do each task, no internal state leaking into URLs. The spec's richer lifecycle (§6) is reduced for the first slice; richer parts return when a real experiment needs them (recorded as a spec deviation).

### D2 Share URL: fragment, not query
- Format `#1j.<base64url(utf8 JSON)>`: `1` = format version, `j` = plain JSON. Reserve `z` for `CompressionStream('deflate-raw')`, implemented only when a config exceeds ~1 KB.
- Why fragment: never reaches servers/logs/CDNs/crawlers; pages stay static and cacheable; no per-config compute to abuse.
- Costs accepted: no per-config OG image (use one static OG image per experiment until M7 gives `/experiments/[slug]/v/<id>`); read via `window.location.hash` in an effect + `hashchange`; server renders a fixed-aspect skeleton to avoid layout shift.
- **Validation order (all failures return `{ok:false, reason}`, fall back to `defaultConfig` with a visible notice, never throw or half-apply):** 1) raw length cap ~4 KB; 2) prefix + charset regex; 3) base64url decode in try/catch + decoded-size cap; 4) if `z`, inflate with streaming output cap; 5) `TextDecoder` `fatal:true`; 6) `JSON.parse` in try/catch; 7) strict envelope `{v,id,config}`; 8) `id` equals the route's experiment; 9) migrate by `v`; 10) strict `configSchema` (ranges, uint32 seed, array length caps, total work cap `n x steps`). Never spread/merge parsed JSON; use only the schema output.
- Hash links are ephemeral, unversioned and effectively public. "Private/Publish/unique saved URL" (spec §7) are M7 features and must be described that way in the UI and docs.

### D3 First experiment: Algorithm Arena, sorting subset
- Defined as **complete** = 4 algorithms (bubble, insertion, merge, quick), two-algorithm race on identical seeded data, live operation counters, input presets (random, reversed, nearly sorted, few unique), shareable link, pointer-paint data.
- Algorithms emit an op trace (`compare(i,j) | swap(i,j) | write(i,v)`) via generator; renderer and counters both derive from the trace, so the visual is the actual algorithm state by construction.
- Fixed pivot rule; PRNG = mulberry32; no `Math.random`, `Date` or `performance` in the core.
- Neural Network Playground becomes experiment #2 (transcendental-function determinism and a worker make it a worse first slice).
- Spec §4.5 lists ~20 algorithms across 5 domains; those remain future work, not part of "complete" for the slice.

### D4 Dependencies
- **In the slice:** next, react, typescript, tailwindcss, zod, vitest, @playwright/test, @axe-core/playwright, eslint, prettier, Geist (next/font or `geist` package).
- **Deferred:** three, @react-three/fiber (hero is Canvas 2D; React 19/Next compatibility unverified), GSAP, Motion, D3, Zustand, React Hook Form, shadcn/ui (native `<select>`/`<input type=range>` first; single Radix primitives only when needed).
- One animation library only, chosen by ADR when UI choreography needs it (never both Motion and GSAP). Slice uses CSS transitions + canvas rAF.

### D5 Server/client boundary
`app/experiments/[slug]/page.tsx` is a Server Component (`generateStaticParams`, metadata from the registry); it passes only the slug to client `ExperimentHost`, which in an effect reads the hash, validates, awaits `definition.load()`, mounts, and destroys on unmount. `load()` is the lazy boundary. No `window`/DPR/`matchMedia` during render. The same module serves hero and experiment page. Arena runs on the main thread.

### D6 Repository layout for experiments (resolves a spec/ADR mismatch)
`src/experiments/<slug>/{manifest.ts, config.ts, core/, view/}` and `src/engine/` (public surface `src/engine/public.ts`). **The registry is the single list**: home, nav, sitemap, terminal and `/explore` all derive from it. ESLint `no-restricted-imports`: experiments import only `engine/public`, never each other; `core/` never imports DOM or React. Contract tests: folder-vs-registry, unique slugs, `defaultConfig` passes its schema and round-trips, mount→destroy twice leaks nothing.

### D7 Tokens: contrast fix
Border `#252C39` on `#090B10` is decorative hairline only (~1.4:1 est.). Interactive control boundaries use a separate `--border-strong` meeting 3:1. All token pairs get a unit test computing WCAG contrast.

### D8 Light theme
Keep the design-review decision: a deliberate light token set in M1 so `theme light` is a real action. If it is not contrast-verified by the end of M1, the command is withheld (reports "not available") rather than faked. (Architect suggested dark-only; this is a recorded divergence, cheap to reverse.)

### D9 Open: CSP vs static pages — M1 spike, then ADR
A nonce-based CSP forces dynamic rendering in Next (architect's knowledge, unverified). M1 includes a spike to choose: hash-based CSP on static pages, or dynamic rendering. Until decided, M1 ships the non-CSP security headers (T13) and records CSP as not yet implemented. LCP element is the headline, not the canvas; hero canvas is a device-qualified lazy island.

## Spec deviations recorded (owner may override)

| Spec | Deviation | Reason |
|---|---|---|
| §6 full lifecycle, perf measurement, isolation per experiment | Reduced to D1 handle for the slice | Shallow modules, split ownership |
| §7 save/publish/unique URL in the slice | Ephemeral fragment links only; saved/published at M7 | No backend until M7 |
| §11 GSAP + Motion + Three + R3F | Deferred, one animation lib by ADR | §13 / ban 19 no duplication |
| §12 particle/node hero visuals | Hero = live sorting race | ADR 0001 premise 5, design review |
| §8/§12 Daily discovery, Featured, Editor's picks | Omitted until >=3 real experiments | Bans 8–10 |
| §14 `features/<name>` | `src/experiments/<slug>` | Contribution boundary, D6 |

## Test strategy (top five for the slice)
1) Core property + golden-trace tests (sorted & permutation; bubble `[3,2,1]` = 3 compares/3 swaps; stepped == run-to-end; seed → golden array). 2) Codec round-trip + hostile corpus, every case `{ok:false}` without throwing. 3) Playwright share-link round trip in a fresh context (no pixel diff); hostile URL shows notice + defaults, no console errors. 4) Registry contract test. 5) a11y: axe on home/experiment in running and error states, keyboard-only play/pause, reduced-motion no autoplay, canvas text alternative, token contrast test.

## Not verified
Next/React/Zod/CompressionStream/CSP behaviour claims; WCAG numbers are estimates until the contrast test runs.
