# Security policy

VOID is an early-stage open-source project. It currently has no backend, accounts or stored user data; the only untrusted input is the URL fragment of a share link, which is validated before use (`src/engine/share/codec.ts`).

## Reporting a vulnerability

Please report suspected vulnerabilities privately through GitHub's "Report a vulnerability" feature on this repository (Security tab), not in a public issue. Include steps to reproduce and the affected URL or file. This is a volunteer project, so response times are best effort.

## What is and is not claimed

See `docs/security.md` (threat model and plan) and `docs/decisions/0004-csp-without-nonces-for-now.md`. In short: baseline security headers and a CSP are set, but the CSP allows inline scripts, so it is not a strong defence against injected script; the code avoids raw HTML injection and a lint rule enforces that. No penetration test has been performed. Nothing here is a claim that the application is secure.
