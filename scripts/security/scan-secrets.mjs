// A small, dependency-free scan of TRACKED files for credentials that must never be committed.
//
//   npm run security:secrets
//
// This is a pattern scan, not a replacement for gitleaks/GitHub secret scanning: it catches the
// common, high-confidence shapes (private keys, GitHub/AWS/Google/Slack/Stripe/OpenAI-style
// keys, JWT triples such as Supabase service-role keys) and files that should not be tracked at
// all (.env files, key files). It scans the working tree's tracked files, not git history.
// Enable GitHub's native secret scanning and push protection in the repository settings too.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** @type {Array<[string, RegExp]>} */
export const PATTERNS = [
  ["private key block", /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY-----/],
  ["GitHub token", /\bgh[pousr]_[A-Za-z0-9]{36,}\b/],
  ["GitHub fine-grained token", /\bgithub_pat_[A-Za-z0-9_]{50,}\b/],
  ["AWS access key id", /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{35}\b/],
  ["Slack token", /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/],
  ["Stripe live key", /\b(?:sk|rk)_live_[0-9a-zA-Z]{20,}\b/],
  ["OpenAI/Anthropic-style secret key", /\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{32,}\b/],
  [
    "JWT (e.g. Supabase service-role key)",
    /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
  ],
  ["npm access token", /\bnpm_[A-Za-z0-9]{36}\b/],
  ["SendGrid API key", /\bSG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\b/],
  ["Supabase secret key", /\bsb_secret_[A-Za-z0-9_-]{20,}\b/],
  [
    "database URL with an embedded password",
    /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|amqps?):\/\/[^\s:@/]+:[^\s@/]{3,}@/,
  ],
];

/** Tracked paths that should never exist in the repository. */
export const FORBIDDEN_FILES = [
  /(^|\/)\.env(\.(?!example$)[^/]+)?$/,
  /\.(pem|key|p12|pfx|jks)$/,
  /(^|\/)id_(rsa|dsa|ecdsa|ed25519)$/,
  /(^|\/)\.npmrc$/,
  /(^|\/)(credentials[^/]*|service-account[^/]*)\.json$/,
];

/**
 * Return findings for one text blob.
 * @param {string} text
 * @returns {Array<{ name: string }>}
 */
export function scanText(text) {
  /** @type {Array<{ name: string }>} */
  const hits = [];
  for (const [name, re] of PATTERNS) {
    const m = re.exec(text);
    if (m) hits.push({ name }); // never print any part of the match: CI logs are readable
  }
  return hits;
}

/** Files that legitimately contain the patterns above (this scanner, its tests). */
const SKIP = [/^scripts\/security\/scan-secrets\.mjs$/, /^tests\/unit\/secret-scan\.test\.ts$/];

export function scanRepo(root = process.cwd()) {
  const files = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" })
    .split("\0")
    .filter(Boolean);
  const findings = [];
  for (const f of files) {
    if (FORBIDDEN_FILES.some((re) => re.test(f)))
      findings.push({ file: f, name: "file that must not be tracked" });
    if (SKIP.some((re) => re.test(f))) continue;
    let text;
    try {
      const buf = readFileSync(`${root}/${f}`);
      if (buf.includes(0)) continue; // binary
      text = buf.toString("utf8");
    } catch {
      continue;
    }
    for (const h of scanText(text)) findings.push({ file: f, ...h });
  }
  return { scanned: files.length, findings };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { scanned, findings } = scanRepo();
  if (findings.length) {
    console.error(`Possible secrets found (${findings.length}):`);
    for (const f of findings) console.error(`  ${f.file}: ${f.name}`);
    process.exit(1);
  }
  console.log(
    `secret scan: ${scanned} tracked files, no findings (pattern scan; not a substitute for gitleaks/GitHub secret scanning)`,
  );
}
