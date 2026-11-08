# Screen-reader test checklist

**Status: NOT PERFORMED.** Automated checks (axe in dark and light themes, keyboard-only and reduced-motion tests) run in CI, but axe finds only a fraction of real screen-reader problems, and no human or screen reader has used VOID yet. This file is the script for doing it, and the table at the bottom is where results go. Do not claim screen-reader support until it has been filled in with real results.

## Setup (pick at least two pairings)

| Platform | Screen reader | Browser |
|---|---|---|
| Windows | NVDA (free) | Firefox and Chrome/Edge |
| macOS | VoiceOver (Cmd+F5) | Safari |
| Android | TalkBack | Chrome |
| iOS | VoiceOver | Safari |

Test against a production build (`npm run build && npm run start`) or the deployed site, in both themes, and once with `prefers-reduced-motion` on.

## Scenarios (for every page unless stated)

1. **Landmarks and headings.** Open the landmarks and headings lists. Expect: a banner, a main, a contentinfo; exactly one level-1 heading; no skipped levels that confuse the outline.
2. **Skip link.** First Tab stops on "Skip to content"; Enter moves focus into main. On an experiment page the experiment must keep its state.
3. **Home hero.** The two canvases are announced as images with a label giving the algorithm name and the current comparison, swap and write counts. The hero is silent: it must not announce progress by itself every few seconds. "Pause" / "Run" is operable by keyboard.
4. **Algorithm Arena.** Run, Step (S), Reset (R) work from the keyboard; the live region announces "Race started", "Race paused", configuration changes, and the final summary naming the winner. Selects and sliders are labelled; the speed slider reads "N operations per second". "Show data as table" exposes the data as a table with a caption; the table region is keyboard-scrollable. Painting on the chart needs a pointer; confirm the data, size and seed controls are an adequate alternative.
5. **Neural Network Playground.** Tab reaches each neuron in the diagram; each announces its layer, neuron number and value (or "not computed yet") and that Enter opens an editor. After Enter the editor heading is reachable and the sliders read their values ("Bias 0.50", "Weight from input x1 ..."). Stepping announces each neuron's computation in words. The prediction text is read when the last neuron is computed. "Show values as table" gives the same information as the diagram. The diagram's scroll region is focusable and labelled on narrow screens.
6. **Share link.** The share field is labelled, selectable, and "Copy link" announces "Link copied". A hostile link (e.g. `#zzz`) announces the notice ("This link is damaged or is not a VOID link. Showing the default settings instead.") and focus is not trapped.
7. **Errors.** Disconnect from the network after load and click "Try again" on a forced load failure (see `ExperimentHost`); the alert is announced.
8. **Theme toggle.** Announces "Theme: dark. Switch to light theme" and the change is reflected.

## What to record

For each scenario and pairing: pass / fail / partial, what was announced (verbatim where it matters), and the fix. File defects as issues; add regression tests for anything that can be asserted automatically.

| Date | Tester | Screen reader + browser | Scenario | Result | Notes / defect link |
|---|---|---|---|---|---|
| | | | | | |
