# 0004 — Content-Security-Policy without nonces (for now)

- Date: 2026-11-08
- Status: Accepted for M1–M6; **must be revisited at M7** (before any user-generated content)
- Resolves: ADR 0002 D9 (CSP spike)
- Evidence: the Next.js 16.4.5 docs bundled in `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md` (read 2026-11-08)

## Findings from the docs (static reading, not a benchmark)

- Nonce-based CSP requires **dynamic rendering of every page**; static optimisation/ISR are disabled, CDN caching is lost, and Partial Prerendering / the static shell is incompatible with nonces.
- Hash/SRI-based CSP keeps static pages but is marked **experimental** (`experimental.sri`).
- The documented "without nonces" option sets a CSP in `next.config` with `'unsafe-inline'` for scripts and styles.

## Decision

Ship the "without nonces" CSP in `next.config.ts`: `default-src 'self'`, `script-src 'self' 'unsafe-inline'`, `style-src 'self' 'unsafe-inline'`, `img-src 'self' data:` (`blob:` was dropped later: nothing uses it, ADR 0006 F5), `font-src 'self'`, `connect-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`. Keeps pages fully static (the architecture and share-link design depend on that) while still blocking plugins, base-tag injection, framing, and third-party script/connect origins.

## What this does and does not protect

- **Does:** blocks `<object>/<embed>`, `<base>` hijack, clickjacking (`frame-ancestors`), form posts to other origins, loading scripts/connections from other origins.
- **Does NOT:** stop injected inline script. Because `script-src` allows `'unsafe-inline'`, CSP is **not** a strong XSS mitigation. Today XSS safety rests on React's escaping and on the fact that no user-generated content exists. The theme-init script is a static string with no user data.
- Documents must not claim "strict CSP".

## Revisit triggers

- Before M7 (accounts, published user content, comments): choose nonce + dynamic rendering for the affected routes, or SRI hashes if stable, and add a test that an injected inline script is blocked.
- Any `dangerouslySetInnerHTML` with non-static data is forbidden until then (lint/review check).
- `connect-src` and `img-src` get explicit additions (e.g. Supabase) in the milestone that needs them, with tests.

## Verification

Playwright asserts the CSP directives are present and the production build renders with **no console errors** (a CSP violation would log one): `tests/e2e/shell.spec.ts`, 14/14 passing on 2026-11-08 (desktop + 360px). Not verified: behaviour in browsers other than Edge/Chromium.
