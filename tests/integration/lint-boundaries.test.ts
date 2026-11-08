import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

/**
 * Proves the architecture rules actually fire (a rule nobody has seen fail is
 * not evidence). Lints in-memory snippets as if they lived at the given paths.
 */
const eslint = new ESLint({ cwd: process.cwd() });

async function violations(filePath: string, code: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.filter((m) => m.severity === 2).map((m) => m.ruleId ?? "parse-error");
}

describe("architecture boundaries are enforced by ESLint", () => {
  const exp = "src/experiments/demo/view/x.ts";
  const core = "src/experiments/demo/core/x.ts";

  it("experiments may import @/engine/public", async () => {
    expect(
      await violations(
        exp,
        'import { defineExperiment } from "@/engine/public";\nexport { defineExperiment };\n',
      ),
    ).toEqual([]);
  });
  it("experiments may not import engine internals", async () => {
    expect(
      await violations(
        exp,
        'import { decodeShare } from "@/engine/share/codec";\nexport { decodeShare };\n',
      ),
    ).toContain("no-restricted-imports");
  });
  it("experiments may not reach engine internals through a relative path either", async () => {
    expect(
      await violations(
        exp,
        'import { decodeShare } from "../../../engine/share/codec";\nexport { decodeShare };\n',
      ),
    ).toContain("no-restricted-imports");
  });
  it("experiments may import their own files relatively", async () => {
    expect(await violations(exp, 'import { x } from "../config";\nexport { x };\n')).not.toContain(
      "no-restricted-imports",
    );
  });
  it("react/no-danger is enforced (CSP allows inline scripts, ADR 0004)", async () => {
    const code = 'export const A = () => <div dangerouslySetInnerHTML={{ __html: "x" }} />;\n';
    expect(await violations("src/components/x.tsx", code)).toContain("react/no-danger");
  });
  it("experiments may not import other experiments", async () => {
    expect(
      await violations(
        exp,
        'import { algorithmArena } from "@/experiments/algorithm-arena/manifest";\nexport { algorithmArena };\n',
      ),
    ).toContain("no-restricted-imports");
  });
  it("experiments may not import the registry or app shell", async () => {
    expect(
      await violations(exp, 'import { experiments } from "@/registry";\nexport { experiments };\n'),
    ).toContain("no-restricted-imports");
    expect(
      await violations(
        exp,
        'import { SiteHeader } from "@/components/layout/site-header";\nexport { SiteHeader };\n',
      ),
    ).toContain("no-restricted-imports");
  });
  it("core/ may not import react or next", async () => {
    expect(
      await violations(core, 'import { useState } from "react";\nexport { useState };\n'),
    ).toContain("no-restricted-imports");
    expect(await violations(core, 'import Link from "next/link";\nexport { Link };\n')).toContain(
      "no-restricted-imports",
    );
  });
  it("core/ may not touch the DOM, clocks, timers or Math.random", async () => {
    for (const code of [
      "export const a = document.title;\n",
      "export const a = window.innerWidth;\n",
      "export const a = Date.now();\n",
      "export const a = performance.now();\n",
      "export const a = Math.random();\n",
      "export const a = setTimeout(() => {}, 1);\n",
    ]) {
      const v = await violations(core, code);
      expect(v.length, code).toBeGreaterThan(0);
    }
  });
  it("core/ pure code is clean", async () => {
    expect(await violations(core, "export const add = (a: number, b: number) => a + b;\n")).toEqual(
      [],
    );
  });
  it("the engine may not import experiments or the registry", async () => {
    expect(
      await violations(
        "src/engine/x.ts",
        'import { algorithmArena } from "@/experiments/algorithm-arena/manifest";\nexport { algorithmArena };\n',
      ),
    ).toContain("no-restricted-imports");
    expect(
      await violations(
        "src/engine/x.ts",
        'import { experiments } from "@/registry";\nexport { experiments };\n',
      ),
    ).toContain("no-restricted-imports");
  });
});
