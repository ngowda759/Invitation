import type { NextConfig } from "next";

/**
 * Security hardening (Phase 8).
 *
 * The invitation is a static-first, self-hosted site: no backend, no database, no
 * third-party runtime services. The response headers below are set once for every
 * route. The Content-Security-Policy is a static header rather than a per-request
 * nonce so the pages stay statically prerendered (a nonce would force dynamic
 * rendering and cost the performance budget won in Phase 7).
 *
 * `script-src`/`style-src` include `'unsafe-inline'` because Next.js emits inline
 * bootstrap scripts and (with `inlineCss`) an inline stylesheet. Nothing in this app
 * injects attacker-controlled HTML — there is no `dangerouslySetInnerHTML`, no user
 * input and no third-party script — so the inline allowance does not open an
 * injection path today. A nonce-based CSP is the documented future step if a
 * dynamic or user-generated surface is ever added (see
 * docs/implementation/PHASE-8-SECURITY.md).
 */
const isDev = process.env.NODE_ENV === "development";

const contentSecurityPolicy = [
  "default-src 'self'",
  // 'unsafe-eval' is only needed by React's dev-time debugging; it is dropped in
  // production, where neither React nor Next.js evaluate strings.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  // This site needs none of these device APIs; deny them outright.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The Playwright dev server is reached over 127.0.0.1; allow its dev origin.
  allowedDevOrigins: ["127.0.0.1"],
  // `X-Powered-By: Next.js` advertises the framework; there is no reason to expose it.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  images: {
    // Prefer the smallest supported modern format: AVIF where the browser accepts
    // it, with WebP as the fallback. This shrinks the gallery payload per device.
    formats: ["image/avif", "image/webp"],
    // Next.js 16 requires an explicit allowlist. Pinning it to the qualities the
    // gallery actually uses keeps the optimizer from serving arbitrary qualities.
    qualities: [60, 75],
  },
  experimental: {
    // Inline the atomic (Tailwind) stylesheet into the document so the first paint
    // is not blocked on a separate CSS request. This targets first-visit LCP.
    inlineCss: true,
  },
};

export default nextConfig;
