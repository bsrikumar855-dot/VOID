import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { decodeShare, encodeShare } from "@/engine/share/codec";
import { experiments, getExperiment, listExperiments } from "@/registry";

/**
 * Contract tests, parameterised over the registry (ADR 0002 D6). Adding an
 * experiment adds cases here automatically.
 */
describe("registry", () => {
  it("every experiments/<slug> folder is registered, and every registered experiment has a folder", () => {
    const dir = join(process.cwd(), "src/experiments");
    const folders = readdirSync(dir).filter((f) => statSync(join(dir, f)).isDirectory());
    expect(folders.sort()).toEqual(experiments.map((e) => e.meta.slug).sort());
  });

  it("ids and slugs are unique", () => {
    expect(new Set(experiments.map((e) => e.meta.id)).size).toBe(experiments.length);
    expect(new Set(experiments.map((e) => e.meta.slug)).size).toBe(experiments.length);
  });

  it("slugs are URL-safe and lookup works", () => {
    for (const e of listExperiments()) {
      expect(e.meta.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(getExperiment(e.meta.slug)).toBe(e);
    }
    expect(getExperiment("nope")).toBeUndefined();
    expect(getExperiment("__proto__")).toBeUndefined();
  });
});

describe.each(experiments.map((e) => [e.meta.slug, e] as const))("experiment %s", (_slug, e) => {
  it("has complete metadata", () => {
    const m = e.meta;
    expect(m.title.length).toBeGreaterThan(0);
    expect(m.summary.length).toBeGreaterThan(10);
    expect(m.category.length).toBeGreaterThan(0);
    expect(m.tags.length).toBeGreaterThan(0);
    expect(Number.isInteger(m.version) && m.version >= 1).toBe(true);
  });

  it("defaultConfig passes its own schema", () => {
    expect(e.configSchema.safeParse(e.defaultConfig).success).toBe(true);
  });

  it("defaultConfig round-trips through the share codec", () => {
    expect(decodeShare(encodeShare(e, e.defaultConfig), e)).toEqual({
      ok: true,
      config: e.defaultConfig,
    });
  });

  it("every curated example is a valid config and round-trips through the codec", () => {
    for (const x of e.examples ?? []) {
      expect(x.title.length).toBeGreaterThan(0);
      expect(x.note.length).toBeGreaterThan(10);
      expect(e.configSchema.safeParse(x.config).success).toBe(true);
      expect(decodeShare(encodeShare(e, x.config), e)).toEqual({ ok: true, config: x.config });
    }
  });

  it("lazy loader resolves to a module with mount()", async () => {
    const mod = await e.load();
    expect(typeof mod.mount).toBe("function");
  });
});
