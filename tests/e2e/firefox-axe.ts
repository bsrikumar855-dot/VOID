import { test } from "@playwright/test";

/**
 * Playwright's Firefox build crashes the page ("Page crashed") when axe-core scans a page that
 * contains a mounted experiment. Findings (2026-11-19, Playwright Firefox, axe-core via
 * @axe-core/playwright): it reproduces on the Algorithm Arena, Neural Network and Glitch Lab pages
 * and on the homepage with its hero running; the axe tests in shell.spec.ts and review-fixes.spec.ts
 * pass in Firefox. On a Glitch Lab page, removing its `section`, or merely re-setting its
 * `aria-labelledby` attribute (even to the same value), makes the page scan cleanly, so no
 * particular markup of ours is what axe flags. It is a browser or tooling crash, not an
 * accessibility finding, and its cause is not understood.
 * Accessibility is still scanned with axe in Chromium (Edge, Chrome and CI), which is where
 * these tests keep their value; everything else in the suite runs in Firefox.
 */
export function skipAxeOnFirefox() {
  test.beforeEach(({ browserName }, testInfo) => {
    test.skip(
      browserName === "firefox" && testInfo.title.startsWith("axe"),
      "axe-core crashes Playwright's Firefox on pages with a mounted experiment (tests/e2e/firefox-axe.ts)",
    );
  });
}
