import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The Playwright dev server is reached over 127.0.0.1; allow its dev origin.
  allowedDevOrigins: ["127.0.0.1"],
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
