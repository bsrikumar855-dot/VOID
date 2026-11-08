import "../zod-config"; // must be first: sets Zod's jitless flag before schemas are built
import { z } from "zod";
import type { ExperimentDefinition } from "../types";

/**
 * Share-link codec (ADR 0002 D2). A link carries only versioned configuration
 * (the seed is part of it), never internal state, in the URL fragment:
 *
 *   #1j.<base64url(utf8 JSON {v, id, config})>
 *
 *   1 = format version, j = plain JSON. (z = deflate-raw is reserved, not implemented.)
 *
 * Decoding is a validation pipeline that never throws and never partially applies:
 * every failure returns { ok: false, reason } and the caller uses defaults.
 */

export const SHARE_FORMAT_VERSION = 1;
export const MAX_FRAGMENT_CHARS = 4096;
export const MAX_DECODED_BYTES = 2048;

export type ShareErrorReason =
  | "too-long"
  | "bad-prefix"
  | "bad-charset"
  | "bad-base64"
  | "too-large"
  | "bad-utf8"
  | "bad-json"
  | "bad-envelope"
  | "wrong-experiment"
  | "unsupported-version"
  | "invalid-config";

export type DecodeResult<C> =
  { ok: true; config: C } | { ok: false; reason: ShareErrorReason; detail?: string };

const PREFIX = `${SHARE_FORMAT_VERSION}j.`;
const BASE64URL = /^[A-Za-z0-9_-]*$/;

const envelopeSchema = z.strictObject({
  v: z.number().int().positive(),
  id: z.string().min(1).max(64),
  config: z.unknown(),
});

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array | null {
  try {
    const std = s.replace(/-/g, "+").replace(/_/g, "/");
    const padded = std + "=".repeat((4 - (std.length % 4)) % 4);
    const bin = atob(padded);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

/** Encode a configuration as a fragment string (without the leading "#"). */
export function encodeShare<C>(
  definition: Pick<ExperimentDefinition<C>, "meta">,
  config: C,
): string {
  const json = JSON.stringify({ v: definition.meta.version, id: definition.meta.id, config });
  return PREFIX + toBase64Url(new TextEncoder().encode(json));
}

/** Decode and fully validate a fragment. Accepts the string with or without "#". */
export function decodeShare<C>(
  fragment: string,
  definition: Pick<ExperimentDefinition<C>, "meta" | "configSchema">,
): DecodeResult<C> {
  const raw = fragment.startsWith("#") ? fragment.slice(1) : fragment;

  if (raw.length > MAX_FRAGMENT_CHARS) return { ok: false, reason: "too-long" };
  if (!raw.startsWith(PREFIX)) return { ok: false, reason: "bad-prefix" };

  const payload = raw.slice(PREFIX.length);
  if (!BASE64URL.test(payload)) return { ok: false, reason: "bad-charset" };

  const bytes = fromBase64Url(payload);
  if (bytes === null) return { ok: false, reason: "bad-base64" };
  if (bytes.length > MAX_DECODED_BYTES) return { ok: false, reason: "too-large" };

  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return { ok: false, reason: "bad-utf8" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: "bad-json" };
  }

  const envelope = envelopeSchema.safeParse(parsed);
  if (!envelope.success) return { ok: false, reason: "bad-envelope" };
  if (envelope.data.id !== definition.meta.id) return { ok: false, reason: "wrong-experiment" };
  if (envelope.data.v !== definition.meta.version) {
    return {
      ok: false,
      reason: "unsupported-version",
      detail: `link v${envelope.data.v}, experiment v${definition.meta.version}`,
    };
  }

  const config = definition.configSchema.safeParse(envelope.data.config);
  if (!config.success) {
    return { ok: false, reason: "invalid-config", detail: config.error.issues[0]?.message };
  }
  return { ok: true, config: config.data };
}
