import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { MAX_FRAGMENT_CHARS, decodeShare, encodeShare } from "@/engine/share/codec";
import { THEME_INIT_SCRIPT } from "@/components/layout/theme";
import { arenaConfigSchema, MAX_SIZE, MAX_VALUE } from "@/experiments/algorithm-arena/config";
import { createRace } from "@/experiments/algorithm-arena/core/sim";
import { mulberry32 } from "@/experiments/algorithm-arena/core/prng";
import { ALGORITHMS } from "@/experiments/algorithm-arena/core/sorts";
import { PRESETS } from "@/experiments/algorithm-arena/core/data";
import { algorithmArena } from "@/experiments/algorithm-arena/manifest";

const def = algorithmArena;

describe("bounded work: the largest configuration the schema allows", () => {
  it("every algorithm pair on every preset at the maximum size stays within a fixed operation budget", () => {
    for (const left of ALGORITHMS) {
      for (const right of ALGORITHMS) {
        for (const preset of PRESETS) {
          const cfg = arenaConfigSchema.parse({
            left,
            right,
            preset,
            size: MAX_SIZE,
            seed: 0xffffffff,
          });
          const race = createRace(cfg);
          // Worst case is bubble/insertion on reversed data: 8128 compares + 8128 swaps.
          expect(race.length, `${left}/${right}/${preset}`).toBeLessThanOrEqual(17_000);
        }
      }
    }
  });

  it("explicit painted values at the maximum size and value are within the same budget", () => {
    const values = Array.from({ length: MAX_SIZE }, (_, i) => MAX_VALUE - i);
    const cfg = arenaConfigSchema.parse({
      left: "bubble",
      right: "insertion",
      preset: "random",
      size: MAX_SIZE,
      seed: 1,
      values,
    });
    expect(createRace(cfg).length).toBeLessThanOrEqual(17_000);
  });

  it("the largest valid link encodes to under half of the fragment cap, so caps stay honest as the schema grows", () => {
    const values = Array.from({ length: MAX_SIZE }, () => MAX_VALUE);
    const cfg = {
      left: "merge",
      right: "quick",
      preset: "few-unique",
      size: MAX_SIZE,
      seed: 0xffffffff,
      values,
    } as const;
    const frag = encodeShare(def, cfg);
    expect(frag.length).toBeLessThan(MAX_FRAGMENT_CHARS / 2);
    expect(decodeShare(frag, def)).toMatchObject({ ok: true });
  });
});

describe("share codec: seeded mutation fuzz", () => {
  it("decode never throws on mutated valid links, and any accepted result satisfies the schema", () => {
    const base = encodeShare(def, {
      ...def.defaultConfig,
      size: 8,
      values: [8, 7, 6, 5, 4, 3, 2, 1],
    });
    const alphabet =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.%+/=#{}[]\"'<>\\ ";
    const rand = mulberry32(20261108);
    let accepted = 0;
    let rejected = 0;
    for (let i = 0; i < 4000; i++) {
      const chars = base.split("");
      const edits = 1 + Math.floor(rand() * 4);
      for (let e = 0; e < edits; e++) {
        const at = Math.floor(rand() * chars.length);
        const op = rand();
        if (op < 0.5) chars[at] = alphabet[Math.floor(rand() * alphabet.length)];
        else if (op < 0.75) chars.splice(at, 1);
        else chars.splice(at, 0, alphabet[Math.floor(rand() * alphabet.length)]);
      }
      const input = chars.join("");
      let result: ReturnType<typeof decodeShare> | undefined;
      expect(() => {
        result = decodeShare(input, def);
      }).not.toThrow();
      if (result?.ok) {
        accepted++;
        expect(def.configSchema.safeParse(result.config).success).toBe(true);
      } else {
        rejected++;
      }
    }
    // Sanity: the fuzzer produced both outcomes, so it is not trivially rejecting everything.
    expect(accepted).toBeGreaterThan(0);
    expect(rejected).toBeGreaterThan(0);
  });

  it("deeply nested and extreme-number JSON is rejected without throwing", () => {
    const b64 = (t: string) => `1j.${Buffer.from(t, "utf8").toString("base64url")}`;
    const deep = `{"v":1,"id":"algorithm-arena","config":${"[".repeat(900)}${"]".repeat(900)}}`;
    for (const text of [
      deep,
      '{"v":1e999,"id":"algorithm-arena","config":{}}',
      '{"v":-0,"id":"algorithm-arena","config":{}}',
    ]) {
      let r: ReturnType<typeof decodeShare> | undefined;
      expect(() => {
        r = decodeShare(b64(text), def);
      }).not.toThrow();
      expect(r?.ok).toBe(false);
    }
  });
});

describe("theme init script (inline script injected into every page)", () => {
  function run(stored: string | null, prefersLight: boolean, storageThrows = false): string | null {
    let applied: string | null = null;
    runInNewContext(THEME_INIT_SCRIPT, {
      localStorage: {
        getItem: () => {
          if (storageThrows) throw new Error("blocked");
          return stored;
        },
      },
      window: { matchMedia: () => ({ matches: prefersLight }) },
      document: { documentElement: { setAttribute: (_k: string, v: string) => (applied = v) } },
    });
    return applied;
  }

  it("only ever applies the literal 'light' or 'dark', whatever is stored", () => {
    for (const stored of [
      "<script>alert(1)</script>",
      'light"x',
      "'; alert(1); '",
      "LIGHT",
      "",
      "null",
      "\u0000",
    ]) {
      expect(["light", "dark"], stored).toContain(run(stored, false));
    }
  });
  it("honours a valid saved choice, else the OS preference, else dark", () => {
    expect(run("light", false)).toBe("light");
    expect(run("dark", true)).toBe("dark");
    expect(run(null, true)).toBe("light");
    expect(run(null, false)).toBe("dark");
  });
  it("survives blocked storage (leaves the default)", () => {
    expect(() => run(null, false, true)).not.toThrow();
  });
});

describe("dangerous sinks stay out of the source tree", () => {
  function files(dir: string): string[] {
    return readdirSync(dir).flatMap((f) => {
      const p = join(dir, f);
      return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(f) ? [p] : [];
    });
  }
  const src = files(join(process.cwd(), "src")).map((p) => [p, readFileSync(p, "utf8")] as const);

  it("dangerouslySetInnerHTML appears only in the root layout, with the constant theme script", () => {
    const hits = src.filter(([, t]) => t.includes("dangerouslySetInnerHTML"));
    expect(hits.map(([p]) => p.replace(/\\/g, "/").split("/src/")[1])).toEqual(["app/layout.tsx"]);
    expect(hits[0][1]).toContain("__html: THEME_INIT_SCRIPT");
  });
  it("no eval, new Function, innerHTML, document.write or window.open", () => {
    for (const [p, t] of src) {
      for (const bad of [
        /\beval\s*\(/,
        /new\s+Function\s*\(/,
        /\.innerHTML\s*=/,
        /document\.write\s*\(/,
        /window\.open\s*\(/,
      ]) {
        expect(bad.test(t), `${p} matches ${bad}`).toBe(false);
      }
    }
  });
});
