import type { NextConfig } from "next";

/**
 * Security headers (docs/security.md T13) and CSP (ADR 0004).
 * CSP here is the documented "without nonces" policy: nonce-based CSP forces
 * dynamic rendering and is incompatible with Cache Components' static shell, and
 * SRI-based CSP is experimental. Consequence: script-src and style-src allow
 * 'unsafe-inline', so CSP is NOT a strong XSS defence yet; XSS safety currently
 * rests on React escaping and on no user-generated content existing. Revisit at M7.
 * HSTS and upgrade-insecure-requests are left to the hosting platform.
 */
const isDev = process.env.NODE_ENV === "development";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  // false on purpose: with partial prefetching, an unknown /experiments/<slug> can be served
  // as a 200 static shell before notFound() resolves (soft 404). Verified: false => real 404.
  // Revisit when Next removes the option (ADR 0005).
  partialPrefetching: false,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
