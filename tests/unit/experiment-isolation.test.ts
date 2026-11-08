import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * A second, independent check of experiment isolation (ESLint is the first): scan every
 * import specifier in every experiment folder. Written so a NEW experiment is covered
 * automatically. Adding an experiment must not require touching this file.
 */
const root = process.cwd();
const experimentsDir = join(root, "src", "experiments");
const slugs = readdirSync(experimentsDir).filter((f) =>
  statSync(join(experimentsDir, f)).isDirectory(),
);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? sourceFiles(p) : /\.(ts|tsx)$/.test(f) ? [p] : [];
  });
}

function specifiers(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/(?:import|export)\s[^"'`;]*?from\s*["']([^"']+)["']/g))
    out.push(m[1]);
  for (const m of text.matchAll(/(?:^|[^\w.])import\s*["']([^"']+)["']/gm)) out.push(m[1]); // side-effect import
  for (const m of text.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g)) out.push(m[1]); // dynamic import
  return out;
}

/** Packages an experiment may use directly. Anything else needs a deliberate decision. */
const ALLOWED_PACKAGES = new Set(["react", "react-dom", "react-dom/client", "zod"]);

describe.each(slugs)("experiment %s is isolated", (slug) => {
  const dir = join(experimentsDir, slug);
  const files = sourceFiles(dir);

  it("has the expected structure", () => {
    expect(files.some((f) => f.endsWith(`${sep}manifest.ts`))).toBe(true);
    expect(files.some((f) => f.endsWith(`${sep}config.ts`))).toBe(true);
    expect(
      files.some((f) => f.endsWith(`${sep}limits.ts`)),
      "limits.ts keeps Zod out of the view",
    ).toBe(true);
    expect(files.some((f) => f.includes(`${sep}core${sep}`))).toBe(true);
    expect(files.some((f) => f.includes(`${sep}view${sep}`))).toBe(true);
  });

  it("imports only: its own files, @/engine/public, and a short list of packages", () => {
    const offenders: string[] = [];
    for (const f of files) {
      for (const spec of specifiers(readFileSync(f, "utf8"))) {
        if (spec === "@/engine/public") continue;
        if (ALLOWED_PACKAGES.has(spec)) continue;
        if (spec.startsWith(".")) {
          const target = resolve(dirname(f), spec);
          if (target === dir || target.startsWith(dir + sep)) continue; // stays inside this experiment
          offenders.push(`${relative(root, f)} -> ${spec} (relative import leaves the experiment)`);
          continue;
        }
        offenders.push(`${relative(root, f)} -> ${spec}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("core/ is framework-free and limits.ts has no runtime imports", () => {
    for (const f of files.filter((x) => x.includes(`${sep}core${sep}`))) {
      for (const spec of specifiers(readFileSync(f, "utf8"))) {
        expect(
          ["react", "react-dom", "react-dom/client", "zod"].includes(spec),
          `${relative(root, f)} imports ${spec}`,
        ).toBe(false);
      }
    }
    const limits = files.find((f) => f.endsWith(`${sep}limits.ts`))!;
    const text = readFileSync(limits, "utf8");
    // type-only imports are erased; any other import is a runtime dependency
    for (const m of text.matchAll(/^import\s+(?!type\b)[^;]*from\s*["']([^"']+)["']/gm)) {
      expect.fail(`limits.ts must not import at runtime: ${m[1]}`);
    }
  });

  it("manifest.ts never imports or lazy-loads its view (server pages import manifests)", () => {
    const manifest = files.find((f) => f.endsWith(`${sep}manifest.ts`))!;
    for (const spec of specifiers(readFileSync(manifest, "utf8"))) {
      expect(/(^|\/)view(\/|$)/.test(spec), `manifest.ts references ${spec}`).toBe(false);
    }
  });

  it("the view never imports config.ts at runtime (it would ship the schema library)", () => {
    for (const f of files.filter((x) => x.includes(`${sep}view${sep}`))) {
      for (const m of readFileSync(f, "utf8").matchAll(
        /^import\s+(?!type\b)[^;]*from\s*["']([^"']+)["']/gm,
      )) {
        expect(/(^|\/)config$/.test(m[1]), `${relative(root, f)} imports ${m[1]} at runtime`).toBe(
          false,
        );
      }
    }
  });
});

describe("the registry is the only list", () => {
  it("every experiment folder appears in src/registry/index.ts exactly once", () => {
    const text = readFileSync(join(root, "src", "registry", "index.ts"), "utf8");
    for (const slug of slugs) {
      const count = text.split(`@/experiments/${slug}/manifest`).length - 1;
      expect(count, `${slug} imported ${count} times in the registry`).toBe(1);
    }
  });

  it("no other source file under src/ names an experiment folder (no second hand-synced list)", () => {
    const offenders: string[] = [];
    for (const f of sourceFiles(join(root, "src"))) {
      const rel = relative(root, f).split(sep).join("/");
      if (rel.startsWith("src/experiments/") || rel === "src/registry/index.ts") continue;
      const text = readFileSync(f, "utf8");
      for (const slug of slugs)
        if (text.includes(`experiments/${slug}`))
          offenders.push(`${rel} mentions experiments/${slug}`);
    }
    expect(offenders).toEqual([]);
  });
});
