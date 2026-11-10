import { describe, expect, it } from "vitest";
import { FORBIDDEN_FILES, scanRepo, scanText } from "../../scripts/security/scan-secrets.mjs";

/**
 * The fake secrets below are assembled from pieces at runtime so this file never contains a
 * real-looking credential itself (and the scanner skips this file anyway).
 */
const j = (...p: string[]) => p.join("");
const fakes: Array<[string, string]> = [
  ["private key block", j("-----BEGIN RSA PRIV", "ATE KEY-----")],
  ["GitHub token", j("ghp", "_", "a".repeat(36))],
  ["GitHub fine-grained token", j("github", "_pat_", "A1".repeat(30))],
  ["AWS access key id", j("AKIA", "ABCDEFGHIJKLMNOP")],
  ["Google API key", j("AIza", "SyA".padEnd(35, "x"))],
  ["Slack token", j("xox", "b-", "1234567890-abcdefghij")],
  ["Stripe live key", j("sk", "_live_", "a1B2".repeat(6))],
  ["OpenAI/Anthropic-style secret key", j("sk", "-ant-", "abcDEF123_-".repeat(4))],
  [
    "JWT (e.g. Supabase service-role key)",
    j(
      "eyJ",
      "hbGciOiJIUzI1NiJ9",
      ".",
      "eyJ",
      "yb2xlIjoic2VydmljZV9yb2xlIn0",
      ".",
      "abcdefghij1234567890",
    ),
  ],
  ["npm access token", j("npm", "_", "A1b2".repeat(9))],
  ["SendGrid API key", j("SG", ".", "abcdefgh12345678", ".", "ABCDEFGH12345678")],
  ["Supabase secret key", j("sb", "_secret_", "abcDEF123_-".repeat(3))],
  ["database URL with an embedded password", j("postgres", "://app:hunter22@db.internal/prod")],
];

describe("secret scanner", () => {
  it.each(fakes)("detects a %s", (name, text) => {
    expect(scanText(`const x = "${text}";`).map((h: { name: string }) => h.name)).toContain(name);
  });

  it("does not flag ordinary code, share links or base64url JSON", () => {
    const benign = [
      "export const nnConfigSchema = z.strictObject({ seed: z.number() });",
      "#1j.eyJ2IjoxLCJpZCI6ImFsZ29yaXRobS1hcmVuYSIsImNvbmZpZyI6e319",
      "const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // read at runtime, never committed",
      "sk-learn is a Python library",
      "AKIA is a prefix",
      "postgres://localhost:5432/app",
      "https://example.com:8080/path",
      "npm_config_cache is an env var name",
    ];
    for (const text of benign) expect(scanText(text), text).toEqual([]);
  });

  it("flags files that must never be tracked, but allows .env.example", () => {
    const bad = [
      ".env",
      ".env.local",
      "config/.env.production",
      "keys/server.pem",
      "id_rsa",
      "certs/site.key",
      "certs/site.p12",
      "release.jks",
      ".npmrc",
      "gcp/service-account-prod.json",
      "aws/credentials.json",
    ];
    const ok = [
      ".env.example",
      "src/env.ts",
      "docs/pem-notes.md",
      "docs/keyboard.md",
      "package.json",
    ];
    for (const f of bad)
      expect(
        FORBIDDEN_FILES.some((re: RegExp) => re.test(f)),
        f,
      ).toBe(true);
    for (const f of ok)
      expect(
        FORBIDDEN_FILES.some((re: RegExp) => re.test(f)),
        f,
      ).toBe(false);
  });

  it("finds nothing in this repository's tracked files", () => {
    const { scanned, findings } = scanRepo();
    expect(scanned).toBeGreaterThan(50);
    expect(findings).toEqual([]);
  });
});
