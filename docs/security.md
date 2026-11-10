# VOID — Security Plan and Threat Model

Source: master spec §15, §16. Status: **a plan and threat model, partly implemented.** Implemented and evidenced controls are listed in `implementation-status.md` and `SECURITY.md`; claims of security are made only there, after evidence. This file is not a statement that a control exists. Method labels follow AUTO-BUILDER's Security gate: *static inspection*, *automated scanning*, *penetration testing* (not performed unless explicitly authorized, and then only against a local disposable target).

> **AMENDED 2026-11-08 by ADR 0002.** T4 (malicious shared configuration) now applies to fragment links `#1j.<base64url>`: raw-length cap, charset check, decoded-size cap, bounded inflate (when `z` is used), fatal UTF-8 decode, guarded `JSON.parse`, strict envelope, route-id match, migration by version, strict Zod schema with a total work cap; failures fall back to defaults with a visible notice; parsed JSON is never merged/spread. T3/T13 CSP was decided in ADR 0004: a CSP **without nonces** is set (script-src and style-src allow 'unsafe-inline'), so it is **not** a strong XSS defence yet; a `react/no-danger` lint rule, a source-grep test and a theme-script test stand in for it until M7. HSTS is left to the host. Status of the slice's security work: independent static review (ADR 0006) found no known confirmed Critical, High or Medium issues in the reviewed scope; no scanning or penetration testing was done. **Still open controls:** strict CSP (M7), HSTS, secret-scanning CI job, actions pinned by SHA, CodeQL, decompression cap (only needed when the `z` codec is added).

## 1. Security gate applicability

The Security gate **applies** to VOID (authentication, user content, externally reachable APIs, untrusted URL fetching, AI tools, secrets, uploads/storage). It triggers per milestone: M1 (headers, env validation), M5 (crypto lab labelling), M6 (X-Ray, API Playground, Agent Arena), M7 (auth, RLS), M8 (comments, moderation), M9 (final review).

## 2. Assets and trust boundaries

| Asset | Boundary |
|---|---|
| User accounts and sessions | Browser ↔ Next.js server ↔ Supabase Auth |
| User-owned experiments, configs, versions | RLS in Postgres; server route handlers |
| Provider API keys, Supabase service-role key | Server only; never in client bundle or logs |
| Server outbound fetches (GitHub, API Playground) | Server → internet (SSRF boundary) |
| Model output and tool calls | Treated as untrusted; budgeted |
| Shared config JSON (URL / DB) | Untrusted input; schema-validated before use |
| Community text (comments, titles, profiles) | Untrusted; sanitized on output |

## 3. Threats and required controls

| ID | Threat | Controls (required) | Test |
|---|---|---|---|
| T1 | SSRF via Codebase X-Ray / API Playground | Allow-list `github.com` host for X-Ray and fetch via GitHub API/raw only; for API Playground resolve DNS, reject loopback, link-local, private, CGNAT, multicast and metadata IPs (incl. IPv6, IPv4-mapped), re-validate on every redirect, pin resolved IP for the connection, cap redirects, size, time | Unit tests with hostile URLs/redirect chains/DNS-rebinding fixtures |
| T2 | Repo content as attack vector (X-Ray) | Never execute or install; parse as data only; size/file-count/depth limits; no path traversal on virtual tree | Fixtures with huge/hostile trees |
| T3 | XSS via user content or shared config | React escaping by default; no `dangerouslySetInnerHTML` on user data; sanitize any rich text; strict CSP | Playwright XSS payload tests |
| T4 | Malicious shared configuration | Zod-validate every config against the experiment's schema; reject unknown keys and out-of-range values; clamp resources | Round-trip + fuzz tests |
| T5 | Arbitrary user JS in main context | **Not allowed.** Any custom-code feature runs only in a sandboxed iframe / worker with no app origin access and enforced limits; deferred until designed and threat-modelled | Architecture review before any such feature |
| T6 | Broken access control | RLS on all user-owned tables; server-side verification of session; never trust client claims; least privilege roles | Policy tests for anon / authed / owner / other / moderator |
| T7 | Secret exposure | Service-role and provider keys server-only; env validation at boot; secret scanning in CI; `.env*` ignored; `.env.example` only | Secret-scan job; bundle grep for key prefixes |
| T8 | Prompt injection / tool abuse (Agent Arena) | Agents have no side-effecting tools by default; output treated as untrusted text and rendered escaped; per-run token/time/step budgets; timeouts; cancellation; audit log of tool use | Budget/cancel tests; injection fixtures |
| T9 | Abuse / DoS | Rate limiting on all write and fetch endpoints; request size limits; pagination caps | Rate-limit tests |
| T10 | Demo output mistaken for real AI | Demo mode flagged in UI and in the run record (`mode: demo`) | UI test + data assertion |
| T11 | Dependency compromise | Minimal dependencies; lockfile committed; `npm audit` in CI; pinned versions; review new deps | CI audit |
| T12 | Third-party skill/tooling supply chain (development-time) | Vendored skills reviewed before use; no auto-run hooks from third parties without review | Documented in decisions |
| T13 | Clickjacking / MIME / transport | Security headers: CSP, `frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS on prod | Header test in e2e |
| T14 | Information leakage in errors/logs | Safe error messages; structured logs without secrets or PII | Review + tests |
| T15 | Moderation abuse (reports, spam, harassment) | Report flow, moderator role with audited actions, rate limits, content visibility enforcement | Authorization tests |

## 4. Database (Supabase / Postgres) rules

RLS enabled on every table in `public`; default deny. Owner-write, visibility-aware read (`public` / `unlisted` / `private`). Moderator role separate and audited. Foreign keys, check constraints, indexes, timestamps on all tables. Service-role key only in server code paths that justify it. Policies tested against five actor types.

## 5. Process controls

Secret scanning and dependency audit in CI; AUTO-BUILDER's `protect-secrets.sh` and `verify-on-stop.sh` hooks are reviewed for adoption (see `docs/decisions/`); independent `security-engineer` review at M6, M7, M8 and a final review at M9; findings tracked in `docs/auto-builder/SECURITY-REVIEW.md`; Critical findings block; High findings need explicit owner acceptance.

## 6. Out of scope until designed

User-supplied executable code, file uploads beyond images/export, payment, private-repo access, OAuth scopes beyond sign-in.
