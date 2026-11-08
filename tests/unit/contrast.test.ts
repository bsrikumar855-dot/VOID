import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/lib/utils/contrast";

/**
 * Parses src/app/globals.css (the single token source) and checks WCAG 2.x
 * contrast for each theme. Ratios are measured here, not assumed.
 */
const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

function tokens(selectorPattern: RegExp): Record<string, string> {
  const m = selectorPattern.exec(css);
  if (!m) throw new Error(`token block not found: ${selectorPattern}`);
  const out: Record<string, string> = {};
  for (const line of m[1].matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)) {
    out[line[1]] = line[2];
  }
  return out;
}

const themes = {
  dark: tokens(/:root,\s*:root\[data-theme="dark"\]\s*\{([^}]*)\}/),
  light: tokens(/:root\[data-theme="light"\]\s*\{([^}]*)\}/),
} as const;

// [foreground, background, minimum ratio, why]
const pairs: Array<[string, string, number, string]> = [
  ["text", "bg", 4.5, "body text on page"],
  ["text", "surface", 4.5, "body text on panel"],
  ["text", "surface-raised", 4.5, "body text on raised surface"],
  ["text-muted", "bg", 4.5, "secondary text on page"],
  ["text-muted", "surface", 4.5, "secondary text on panel"],
  ["text-muted", "surface-raised", 4.5, "secondary text on raised surface"],
  ["accent", "bg", 4.5, "accent text/links on page"],
  ["accent", "surface", 4.5, "accent text on panel"],
  ["accent-2", "bg", 4.5, "secondary accent text on page"],
  ["accent-2", "surface", 4.5, "secondary accent text on panel"],
  ["accent-ink", "accent", 4.5, "label on accent fill"],
  ["danger", "bg", 4.5, "error text on page"],
  ["danger", "surface", 4.5, "error text on panel"],
  ["border-strong", "bg", 3, "control boundary vs page (WCAG 1.4.11)"],
  ["border-strong", "surface", 3, "control boundary vs panel (WCAG 1.4.11)"],
  ["accent", "bg", 3, "focus ring vs page (WCAG 1.4.11)"],
];

describe.each(Object.entries(themes))("%s theme contrast", (_name, t) => {
  it.each(pairs)("%s on %s >= %s (%s)", (fg, bg, min) => {
    expect(t[fg], `token --${fg} defined`).toBeDefined();
    expect(t[bg], `token --${bg} defined`).toBeDefined();
    const ratio = contrastRatio(t[fg], t[bg]);
    expect(ratio, `${fg} on ${bg} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(min);
  });

  it("defines exactly the same token names as the other theme", () => {
    expect(Object.keys(t).sort()).toEqual(Object.keys(themes.dark).sort());
  });
});
