import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Structural guards for .github/workflows. Text-level on purpose (no YAML dependency): each
 * check encodes one rule from ADR 0008 / the security review so a later edit cannot silently
 * undo it.
 */
const dir = ".github/workflows";
const workflows = readdirSync(dir)
  .filter((f) => /\.ya?ml$/.test(f))
  .map((f) => ({ file: f, text: readFileSync(`${dir}/${f}`, "utf8") }));

describe("GitHub workflows", () => {
  it("finds the workflows it is meant to guard", () => {
    expect(workflows.map((w) => w.file).sort()).toEqual(["ci.yml", "codeql.yml"]);
  });

  it.each(workflows)("$file pins every action to a 40-character commit SHA", ({ text }) => {
    const uses = [...text.matchAll(/^\s*-?\s*uses:\s*(\S+)/gm)].map((m) => m[1]);
    expect(uses.length).toBeGreaterThan(0);
    for (const u of uses) expect(u, u).toMatch(/^[\w.-]+\/[\w./-]+@[0-9a-f]{40}$/);
  });

  it.each(workflows)("$file does not persist the checkout token", ({ text }) => {
    const lines = text.split("\n");
    lines.forEach((line, i) => {
      if (!/uses:\s*actions\/checkout@/.test(line)) return;
      const following = lines.slice(i + 1, i + 4).join("\n");
      expect(following, `checkout at line ${i + 1}`).toMatch(/persist-credentials:\s*false/);
    });
  });

  it.each(workflows)(
    "$file has read-only default permissions and no dangerous triggers",
    ({ text }) => {
      expect(text).toMatch(/^permissions:\s*\n\s+contents:\s*read\s*$/m);
      expect(text).not.toMatch(/pull_request_target/);
      // Untrusted event data must never be interpolated into a shell step.
      expect(text).not.toMatch(
        /\$\{\{\s*github\.(event\.(issue|pull_request|comment|head_commit)|head_ref)/,
      );
    },
  );
});
