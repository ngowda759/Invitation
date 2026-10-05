import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The Playwright dev server is reached over 127.0.0.1; allow its dev origin.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
