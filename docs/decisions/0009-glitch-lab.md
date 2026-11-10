# 0009 — Glitch Lab (experiment #3) and what it proved about the engine

- Date: 2026-11-10
- Status: Accepted
- Evidence: `tests/unit/glitch-core.test.ts`, `tests/e2e/glitch-lab.spec.ts`, `docs/perf/three-experiments-*.md`

## Why this experiment

Experiments #1 and #2 are both React plus Canvas 2D or SVG on the main thread. Glitch Lab was chosen to push on what they did not: **WebGL**, **a GPU-side computation whose output must be exactly checkable**, **`prefers-reduced-motion` and flash safety**, **file export**, and **graceful degradation** when the GPU is unavailable.

## Decisions

1. **No uploads.** The source is a procedurally generated test image, a pure function of `(kind, seed)`. A share link therefore carries only nine small integers and reproduces one exact frame; there is no file-handling attack surface and no image data in URLs.
2. **Integer-only pipeline, so "same link, same pixels" is testable.** The effects (torn rows, wave, colour split, posterize, noise, scanlines) use whole-number arithmetic and a PCG integer hash instead of `fract(sin(...))`, which differs between GPUs. The pure reference in `core/pipeline.ts` and the fragment shader in `view/renderers.ts` are the same arithmetic written twice. Negative integer division, which GLSL leaves unspecified, is avoided or routed through a sign-safe helper.
3. **Two renderers, one interface.** WebGL 2 (preferred) and a CPU renderer that runs the reference into a 2D canvas. The CPU renderer is used when WebGL 2 is unavailable, the shader fails to link, or the context is lost. The page says which one is drawing.
4. **Animation is opt-in, always.** It never starts by itself (reduced motion or not), runs at a fixed 12 frames a second, and the page warns that glitch effects can flicker. The frame number is part of the config, so pausing makes the current frame the shareable one.
5. **Export is the canvas.** Download PNG saves `canvas.toBlob`, 512 by 512, named from the config. The context uses `preserveDrawingBuffer` so the export cannot read a cleared buffer.
6. **Startup is asynchronous.** See "A performance regression found and fixed".

## What was verified (and how)

| Claim | Evidence |
|---|---|
| The hash is correct | Reference values from an independent Python implementation (`glitch-core.test.ts`) |
| Each effect does what its label says | Pixel-level unit tests on the reference: colour split reads 12 px left/right at shift 50, posterize thresholds for 2, 4 and 16 levels, scanline factor, noise bounds and channel equality, wave extremes and period, band offsets, re-roll every second frame |
| Every curated example's note is literally true | Tests of each claim (`glitch-core.test.ts`, "curated examples") |
| The GPU draws exactly the reference pixels | `glitch-lab.spec.ts`: SHA-256 of the canvas's RGBA bytes in the browser equals the SHA-256 of `renderReference` in Node, for the default, the three examples and two extreme configurations, on desktop and 360 px projects (Edge; Chrome run once) |
| The CPU fallback draws the same pixels | Same spec with `getContext("webgl2")` forced to return null |
| Download PNG saves what is on screen | The downloaded file is decoded in the test (its own minimal PNG decoder) and its bytes equal the reference |
| The GPU test is not vacuous | A deliberate shader mutation (`/ 100` to `/ 101` in the scanline step) was rebuilt and made the GPU tests fail with different digests, then reverted |
| Source images are stable | 20 digests pinned in `glitch-core.test.ts`, taken before an optimisation and unchanged after it (they pin behaviour; they are not an independent oracle) |

## A performance regression found and fixed

The first Lighthouse run of the route (mobile, five runs) scored **95** (93 to 96) with **252 ms** total blocking time, over the 200 ms budget in `docs/perf/README.md`; the other routes were 72 to 81 ms. Lighthouse's long-task list pointed at the Glitch Lab view chunk (about 253 ms at its 4x scale, so roughly 60 ms real): React render, source generation, WebGL context and shader link, and the first draw, all in one block. Two changes:

- **Cheaper source generation:** rows that repeat are built once and copied, ring colours are looked up instead of recomputed per pixel, and the gradient no longer allocates an array per pixel. Cost 9 to 20 ms per image fell to about 4 ms; the output is byte-identical (digests above).
- **Non-blocking startup:** the renderer starts after the first paint, in its own task, and the shader is linked with `KHR_parallel_shader_compile` (the driver links off the main thread and the code polls for completion) instead of blocking on `getProgramParameter`.

Result, same machine and method: mobile **100** (100/100/99/100/100) with **78 ms** blocking time. All five routes were then re-measured on the final build (`docs/perf/three-experiments-mobile.md`, `-desktop.md`): 100 on mobile and desktop everywhere; mobile blocking time 72 to 90 ms; desktop CLS 0.059 on this route (below 0.1). One of five mobile runs on `/` scored 73 (median 100): run-to-run noise on one machine. The caveats of ADR 0007 apply (one machine, localhost, simulated throttling, Edge).

## What this proves about the engine, and what it does not

Adding the experiment required, **outside its own folder**: one import and one entry in `src/registry/index.ts`. Nothing in the engine, the homepage, Explore, the other experiments or the CI scripts was edited. The generic registry-contract, isolation and browser-contract tests, the bundle-budget script (which now discovers experiment routes from `src/experiments/*`, added after the review of the second cycle) and the Explore/homepage derivations all picked it up automatically, including its three examples.

Cost to every page: the new manifest and its Zod schema added 0.8 KB gzip to the initial JavaScript of every route that imports the registry (210.4 to 211.2 KB, budget 225). The view is a lazy chunk (about 7 KB gzip).

Limits of this proof: still one main thread (no Web Worker); no experiment yet needs a server; the GPU-versus-reference check ran on real GPUs in Edge and Chrome on one machine and on CI's software renderer only if the CI run says so (see `implementation-status.md`); WebGL context-loss recovery (switching to the CPU renderer) is implemented but not exercised by a test; reduced motion was tested through media emulation, not on a real system setting; no assistive-technology testing.

## Known gaps

- The canvas is a single `role="img"` with a text description; it conveys what is drawn but not the pixels, which is inherent.
- The CPU fallback takes tens of milliseconds a frame, so animation is slower there.
- Posterize slider maps 0 to "off" and 1 to 15 onto 2 to 16 levels; the config holds levels directly.
- No image upload: a deliberate choice, but it limits the experiment to generated test images.
