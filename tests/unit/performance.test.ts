import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

import nextConfig from "../../next.config";

/**
 * Phase 7 — Performance.
 *
 * These are deterministic, non-timing invariants: they guard the delivery shape
 * that keeps the invitation fast, so a later change cannot silently regress it.
 * Runtime measurements (LCP, CLS) live in tests/e2e/performance.spec.ts, because
 * they need a real browser.
 */

const REPO_ROOT = process.cwd();
const SRC_DIR = join(REPO_ROOT, "src");

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (/\.(ts|tsx)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

const sourceFiles = walk(SRC_DIR).map((abs) => ({
  abs,
  rel: relative(REPO_ROOT, abs).split("\\").join("/"),
}));

function read(rel: string): string {
  return readFileSync(join(REPO_ROOT, rel), "utf8");
}

describe("Server-first delivery", () => {
  it("keeps the client bundle to a single, justified client island", () => {
    const clientModules = sourceFiles
      .filter((file) => /^\s*["']use client["'];?/m.test(readFileSync(file.abs, "utf8")))
      .map((file) => file.rel)
      .sort();

    // Share is the only section that needs interactivity (the native share sheet /
    // clipboard). Everything else renders on the server and ships no client JS.
    expect(clientModules).toEqual(["src/components/experience/ShareExperience.tsx"]);
  });

  it("keeps the home page and content sections as Server Components", () => {
    for (const rel of [
      "src/app/page.tsx",
      "src/app/layout.tsx",
      "src/components/experience/TempleHero.tsx",
      "src/components/experience/GalleryExperience.tsx",
      "src/components/experience/SevaSection.tsx",
      "src/components/experience/TempleMapSection.tsx",
    ]) {
      expect(read(rel)).not.toMatch(/["']use client["']/);
    }
  });

  it("does not inject raw HTML or load third-party scripts", () => {
    for (const file of sourceFiles) {
      const text = readFileSync(file.abs, "utf8");
      expect(text, `${file.rel} uses dangerouslySetInnerHTML`).not.toMatch(
        /dangerouslySetInnerHTML/,
      );
      expect(text, `${file.rel} imports next/script`).not.toMatch(/from\s+["']next\/script["']/);
      expect(text, `${file.rel} embeds an external script`).not.toMatch(
        /<script[^>]+src=["']https?:\/\//,
      );
    }
  });
});

describe("Image payload", () => {
  it("uses the Next.js image component for every gallery image", () => {
    const gallery = read("src/components/experience/GalleryExperience.tsx");
    expect(gallery).toMatch(/from\s+["']next\/image["']/);
    // No raw <img> tags; next/image handles sizing, formats and lazy loading.
    expect(gallery).not.toMatch(/<img\b/);
  });

  it("declares responsive sizes, explicit quality and lazy loading", () => {
    const gallery = read("src/components/experience/GalleryExperience.tsx");
    expect(gallery).toMatch(/sizes=/);
    expect(gallery).toMatch(/quality=\{?\d+\}?/);
    expect(gallery).toMatch(/loading="lazy"/);
  });
});

describe("Delivery configuration", () => {
  it("serves modern image formats from an explicit quality allowlist", () => {
    expect(nextConfig.images?.formats).toContain("image/avif");
    expect(nextConfig.images?.formats).toContain("image/webp");
    // Next.js 16 requires the qualities allowlist to be set explicitly.
    expect(nextConfig.images?.qualities?.length ?? 0).toBeGreaterThan(0);
  });

  it("inlines the atomic stylesheet to avoid a render-blocking request", () => {
    expect(nextConfig.experimental?.inlineCss).toBe(true);
  });
});
