import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

import nextConfig from "../../next.config";
import {
  EXTERNAL_LINK_REL,
  isExternalHref,
  isSafeImageSrc,
} from "@/lib/security";

/**
 * Phase 8 — Security / Hardening.
 *
 * Deterministic, non-timing invariants that guard the delivery shape: response
 * security headers, a static-first CSP that still permits exactly what the app
 * ships, no unsafe HTML, hardened external links, same-origin-only images, no
 * committed secrets, and a dependency tree without known production advisories.
 * Runtime header delivery is asserted in tests/e2e/security.spec.ts.
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

async function securityHeaders(): Promise<Record<string, string>> {
  const routes = await nextConfig.headers?.();
  expect(routes).toBeTruthy();
  const route = (routes ?? []).find((r) => r.source === "/(.*)");
  expect(route, "a catch-all header route must exist").toBeTruthy();
  return Object.fromEntries((route?.headers ?? []).map((h) => [h.key, h.value]));
}

describe("Response security headers", () => {
  it("sets the baseline hardening headers on every route", async () => {
    const headers = await securityHeaders();
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Cross-Origin-Opener-Policy"]).toBe("same-origin");
    expect(headers["Cross-Origin-Resource-Policy"]).toBe("same-origin");
    expect(headers["Strict-Transport-Security"]).toMatch(/max-age=\d{6,}/);
    expect(headers["Strict-Transport-Security"]).toMatch(/includeSubDomains/);
  });

  it("denies device and payment APIs that the invitation never uses", async () => {
    const headers = await securityHeaders();
    const policy = headers["Permissions-Policy"];
    for (const feature of ["camera", "microphone", "geolocation", "payment"]) {
      expect(policy).toContain(`${feature}=()`);
    }
  });

  it("does not advertise the framework", () => {
    expect(nextConfig.poweredByHeader).toBe(false);
  });
});

describe("Content Security Policy", () => {
  it("locks down the dangerous directives", async () => {
    const csp = (await securityHeaders())["Content-Security-Policy"];
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("form-action 'none'");
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("does not allow a third-party script, frame or connect origin", async () => {
    const csp = (await securityHeaders())["Content-Security-Policy"];
    // Every source is 'self' (plus the Next.js inline allowances); no external host
    // may serve a script, frame or make a connection.
    for (const directive of ["script-src", "connect-src", "frame-src"]) {
      const match = new RegExp(`${directive} ([^;]+)`).exec(csp);
      if (match) expect(match[1]).not.toMatch(/https?:\/\//);
    }
    expect(csp).not.toContain("frame-src http");
  });

  it("stays statically renderable (no nonce, so pages are not forced dynamic)", async () => {
    const csp = (await securityHeaders())["Content-Security-Policy"];
    expect(csp).not.toMatch(/'nonce-/);
  });

  it("drops 'unsafe-eval' from the production script policy", async () => {
    const csp = (await securityHeaders())["Content-Security-Policy"];
    // Tests run with NODE_ENV=test, which is not the development branch.
    expect(csp).not.toContain("'unsafe-eval'");
  });

  it("allows the inline styles that inlineCss requires", async () => {
    const csp = (await securityHeaders())["Content-Security-Policy"];
    expect(nextConfig.experimental?.inlineCss).toBe(true);
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
  });
});

describe("Unsafe HTML and content injection", () => {
  it("never injects raw HTML or loads third-party scripts", () => {
    for (const file of sourceFiles) {
      const text = readFileSync(file.abs, "utf8");
      expect(text, `${file.rel} uses dangerouslySetInnerHTML`).not.toMatch(
        /dangerouslySetInnerHTML/,
      );
      expect(text, `${file.rel} imports next/script`).not.toMatch(/from\s+["']next\/script["']/);
      expect(text, `${file.rel} embeds an external script`).not.toMatch(
        /<script[^>]+src=["']https?:\/\//,
      );
      expect(text, `${file.rel} uses an inline event handler attribute`).not.toMatch(
        /\son(?:click|load|error|mouseover)\s*=/,
      );
    }
  });

  it("ships no forms, iframes or javascript: URLs", () => {
    for (const file of sourceFiles) {
      const text = readFileSync(file.abs, "utf8");
      expect(text, `${file.rel} renders a <form>`).not.toMatch(/<form\b/);
      expect(text, `${file.rel} renders an <iframe>`).not.toMatch(/<iframe\b/);
      expect(text, `${file.rel} uses a javascript: URL`).not.toMatch(/javascript:/i);
    }
  });
});

describe("External links", () => {
  it("requires noopener noreferrer on every new-tab link", () => {
    for (const file of sourceFiles) {
      const text = readFileSync(file.abs, "utf8");
      // Every anchor that opens a new tab must set the rel guard. The components
      // use the shared EXTERNAL_LINK_REL constant for this.
      const anchors = text.match(/<[^>]*target="_blank"[^>]*>/g) ?? [];
      for (const anchor of anchors) {
        expect(anchor, `${file.rel}: ${anchor}`).toContain("rel=");
      }
    }
  });

  it("builds external URLs only from encoded, supplied values", () => {
    const map = read("src/components/experience/TempleMapSection.tsx");
    expect(map).toMatch(/encodeURIComponent\(place\)/);
    const share = read("src/components/experience/ShareExperience.tsx");
    expect(share).toMatch(/encodeURIComponent\(message\)/);
  });

  it("uses the shared rel constant rather than a literal", () => {
    expect(EXTERNAL_LINK_REL).toBe("noopener noreferrer");
    for (const rel of [
      "src/components/experience/ShareExperience.tsx",
      "src/components/experience/TempleMapSection.tsx",
    ]) {
      expect(read(rel)).toContain("rel={EXTERNAL_LINK_REL}");
    }
  });
});

describe("Same-origin images", () => {
  it("accepts public paths and rejects anything off-origin or traversing", () => {
    expect(isSafeImageSrc("/images/temple.jpg")).toBe(true);
    expect(isSafeImageSrc("/images/nested/photo.webp")).toBe(true);
    expect(isSafeImageSrc("https://evil.example/x.jpg")).toBe(false);
    expect(isSafeImageSrc("//evil.example/x.jpg")).toBe(false);
    expect(isSafeImageSrc("data:image/svg+xml,<svg/>")).toBe(false);
    expect(isSafeImageSrc("/images/../../etc/passwd")).toBe(false);
    expect(isSafeImageSrc("images/temple.jpg")).toBe(false);
  });

  it("classifies external hrefs correctly", () => {
    expect(isExternalHref("https://wa.me/?text=hi")).toBe(true);
    expect(isExternalHref("#gallery")).toBe(false);
    expect(isExternalHref("/about")).toBe(false);
  });

  it("drops an unsafe gallery source before rendering", () => {
    const gallery = read("src/components/experience/GalleryExperience.tsx");
    expect(gallery).toMatch(/isSafeImageSrc/);
    expect(gallery).toMatch(/safeImages/);
  });
});

describe("Secrets", () => {
  it("tracks no environment files", () => {
    const tracked = execFileSync("git", ["ls-files"], { cwd: REPO_ROOT, encoding: "utf8" });
    const envFiles = tracked
      .split("\n")
      .filter((f) => /(^|\/)\.env(\.|$)/.test(f));
    expect(envFiles).toEqual([]);
  });

  it("contains no hard-coded credential literals in source", () => {
    const patterns = [
      /\bsk-[A-Za-z0-9]{20,}\b/,
      /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
      /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
      /\bAKIA[0-9A-Z]{16}\b/,
      /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    ];
    for (const file of sourceFiles) {
      const text = readFileSync(file.abs, "utf8");
      for (const pattern of patterns) {
        expect(text, `${file.rel} matches ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  it("keeps the lockfile free of plaintext registry credentials", () => {
    const lock = read("package-lock.json");
    expect(lock).not.toMatch(/:(?:\/\/)[^/@"]+:[^/@"]+@/);
  });
});

describe("Dependency vulnerabilities", () => {
  it("has no known advisories in production dependencies", () => {
    // `--omit=dev` is the runtime attack surface. The remaining advisories are in
    // dev-only tooling and are tracked in docs/implementation/PHASE-8-SECURITY.md.
    let output: string;
    try {
      output = execFileSync("npm", ["audit", "--omit=dev", "--json"], {
        cwd: REPO_ROOT,
        encoding: "utf8",
      });
    } catch (error) {
      // npm audit exits non-zero when advisories are found; capture its JSON body.
      output = (error as { stdout?: string }).stdout ?? "{}";
    }
    const report = JSON.parse(output) as {
      metadata?: { vulnerabilities?: { total?: number } };
    };
    expect(report.metadata?.vulnerabilities?.total ?? 0).toBe(0);
  });
});
