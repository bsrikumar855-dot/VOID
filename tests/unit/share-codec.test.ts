import { describe, expect, it } from "vitest";
import {
  MAX_DECODED_BYTES,
  MAX_FRAGMENT_CHARS,
  decodeShare,
  encodeShare,
  type ShareErrorReason,
} from "@/engine/share/codec";
import { algorithmArena } from "@/experiments/algorithm-arena/manifest";
import { defaultArenaConfig } from "@/experiments/algorithm-arena/config";

const def = algorithmArena;

function b64url(text: string): string {
  return Buffer.from(text, "utf8").toString("base64url");
}
function link(obj: unknown): string {
  return `1j.${b64url(JSON.stringify(obj))}`;
}
const good = { v: 1, id: "algorithm-arena", config: defaultArenaConfig };

describe("share codec: round trip", () => {
  it("decode(encode(config)) is identical, with and without the leading #", () => {
    const frag = encodeShare(def, defaultArenaConfig);
    for (const input of [frag, `#${frag}`]) {
      const r = decodeShare(input, def);
      expect(r).toEqual({ ok: true, config: defaultArenaConfig });
    }
  });

  it("round-trips explicit painted values", () => {
    const cfg = { ...defaultArenaConfig, size: 8, values: [8, 7, 6, 5, 4, 3, 2, 1] };
    expect(decodeShare(encodeShare(def, cfg), def)).toEqual({ ok: true, config: cfg });
  });

  it("a default-config link is small (well under the caps)", () => {
    const frag = encodeShare(def, defaultArenaConfig);
    expect(frag.length).toBeLessThan(250);
  });

  it("uses only URL-fragment-safe characters", () => {
    expect(encodeShare(def, defaultArenaConfig)).toMatch(/^1j\.[A-Za-z0-9_-]+$/);
  });
});

/** Every hostile input must return { ok:false } with the stated reason and must never throw. */
const hostile: Array<[string, string, ShareErrorReason]> = [
  ["empty string", "", "bad-prefix"],
  ["just a hash", "#", "bad-prefix"],
  ["wrong prefix", "2j.abcd", "bad-prefix"],
  ["reserved z codec (not implemented)", "1z.abcd", "bad-prefix"],
  ["no dot", "1jabcd", "bad-prefix"],
  ["over the length cap", `1j.${"A".repeat(MAX_FRAGMENT_CHARS)}`, "too-long"],
  ["bad charset: plus and slash", "1j.ab+/cd", "bad-charset"],
  ["bad charset: space", "1j.ab cd", "bad-charset"],
  ["bad charset: percent-encoding", "1j.%7B%7D", "bad-charset"],
  ["bad charset: padding", "1j.eyJ9==", "bad-charset"],
  ["bad base64 length (len % 4 == 1)", "1j.abcde", "bad-base64"],
  [
    "decoded larger than cap",
    `1j.${Buffer.alloc(MAX_DECODED_BYTES + 1, 65).toString("base64url")}`,
    "too-large",
  ],
  ["invalid UTF-8", `1j.${Buffer.from([0xff, 0xfe, 0xfd]).toString("base64url")}`, "bad-utf8"],
  ["not JSON", `1j.${b64url("not json {")}`, "bad-json"],
  ["JSON but not an object", link([1, 2, 3]), "bad-envelope"],
  ["JSON null", link(null), "bad-envelope"],
  ["envelope missing config key", link({ v: 1, id: "algorithm-arena" }), "bad-envelope"],
  ["envelope unknown extra key", link({ ...good, extra: 1 }), "bad-envelope"],
  [
    "envelope __proto__ key",
    `1j.${b64url('{"v":1,"id":"algorithm-arena","config":{},"__proto__":{"x":1}}')}`,
    "bad-envelope",
  ],
  ["v is a string", link({ ...good, v: "1" }), "bad-envelope"],
  ["v is zero", link({ ...good, v: 0 }), "bad-envelope"],
  ["id is not a string", link({ ...good, id: 7 }), "bad-envelope"],
  ["id too long", link({ ...good, id: "x".repeat(65) }), "bad-envelope"],
  ["link for a different experiment", link({ ...good, id: "neural-network" }), "wrong-experiment"],
  ["newer config version", link({ ...good, v: 2 }), "unsupported-version"],
  ["older/unknown config version", link({ ...good, v: 99 }), "unsupported-version"],
  [
    "config unknown key",
    link({ ...good, config: { ...defaultArenaConfig, evil: true } }),
    "invalid-config",
  ],
  [
    "config __proto__ key",
    `1j.${b64url(`{"v":1,"id":"algorithm-arena","config":{"__proto__":{"polluted":true},"left":"bubble","right":"quick","preset":"random","size":48,"seed":7}}`)}`,
    "invalid-config",
  ],
  [
    "unknown algorithm",
    link({ ...good, config: { ...defaultArenaConfig, left: "bogo" } }),
    "invalid-config",
  ],
  [
    "size below range",
    link({ ...good, config: { ...defaultArenaConfig, size: 7 } }),
    "invalid-config",
  ],
  [
    "size above range (work cap)",
    link({ ...good, config: { ...defaultArenaConfig, size: 100000 } }),
    "invalid-config",
  ],
  [
    "size not an integer",
    link({ ...good, config: { ...defaultArenaConfig, size: 48.5 } }),
    "invalid-config",
  ],
  [
    "size is a string",
    link({ ...good, config: { ...defaultArenaConfig, size: "48" } }),
    "invalid-config",
  ],
  [
    "negative seed",
    link({ ...good, config: { ...defaultArenaConfig, seed: -1 } }),
    "invalid-config",
  ],
  [
    "seed above uint32",
    link({ ...good, config: { ...defaultArenaConfig, seed: 2 ** 32 } }),
    "invalid-config",
  ],
  [
    "NaN-like seed (null)",
    link({ ...good, config: { ...defaultArenaConfig, seed: null } }),
    "invalid-config",
  ],
  [
    "values length mismatch",
    link({
      ...good,
      config: { ...defaultArenaConfig, size: 48, values: [1, 2, 3, 4, 5, 6, 7, 8] },
    }),
    "invalid-config",
  ],
  [
    "values out of range",
    link({
      ...good,
      config: { ...defaultArenaConfig, size: 8, values: [1, 2, 3, 4, 5, 6, 7, 9999] },
    }),
    "invalid-config",
  ],
  [
    "huge values array hits the length cap first",
    link({ ...good, config: { ...defaultArenaConfig, size: 48, values: Array(5000).fill(1) } }),
    "too-long",
  ],
  [
    "values array over the schema cap (200 > 128)",
    link({ ...good, config: { ...defaultArenaConfig, size: 200, values: Array(200).fill(1) } }),
    "invalid-config",
  ],
  [
    "values contains non-number",
    link({
      ...good,
      config: { ...defaultArenaConfig, size: 8, values: [1, 2, 3, 4, 5, 6, 7, "x"] },
    }),
    "invalid-config",
  ],
  ["a string that looks like a script", `1j.${b64url("<script>alert(1)</script>")}`, "bad-json"],
];

describe("share codec: hostile corpus", () => {
  it.each(hostile)("%s -> %s", (_name, input, reason) => {
    let result: ReturnType<typeof decodeShare> | undefined;
    expect(() => {
      result = decodeShare(input, def);
    }).not.toThrow();
    expect(result).toMatchObject({ ok: false, reason });
  });

  it("never pollutes Object.prototype", () => {
    decodeShare(`1j.${b64url('{"__proto__":{"polluted":true}}')}`, def);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("decodes a valid link whose JSON has extra whitespace", () => {
    const text = ` { "v" : 1 , "id":"algorithm-arena", "config": ${JSON.stringify(defaultArenaConfig)} } `;
    expect(decodeShare(`1j.${b64url(text)}`, def)).toMatchObject({ ok: true });
  });

  it("returns only schema output, not the raw parsed object", () => {
    const r = decodeShare(encodeShare(def, defaultArenaConfig), def);
    expect(r.ok).toBe(true);
    if (r.ok) expect(Object.keys(r.config).sort()).toEqual(Object.keys(defaultArenaConfig).sort());
  });
});
