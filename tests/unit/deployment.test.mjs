/**
 * Deployment contract (post-release GitHub Pages fix).
 *
 * Guards the static-export deployment so the defect that published the repository
 * README instead of the built application cannot silently return. These are
 * deterministic invariants read from the real files: the Next.js config must be a
 * static export with an environment-aware base path, and the Pages workflow must
 * upload only the generated `out/` output.
 */
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => readFileSync(resolve(repoRoot, p), "utf8");

const nextConfig = read("next.config.ts");
const deploy = read(".github/workflows/deploy-pages.yml");

describe("Next.js static export configuration", () => {
  it("exports the application as a static site", () => {
    expect(nextConfig).toMatch(/output:\s*["']export["']/);
  });

  it("reads the base path from the environment instead of hard-coding it", () => {
    // GitHub Pages project hosting needs `/Invitation`; local development needs "".
    expect(nextConfig).toMatch(/basePath:\s*\(process\.env\.PAGES_BASE_PATH/);
    expect(nextConfig).not.toMatch(/basePath:\s*["']\/Invitation["']/);
  });

  it("serves images unoptimized, since a static export has no optimizer", () => {
    expect(nextConfig).toMatch(/unoptimized:\s*true/);
  });
});

describe("Application icon", () => {
  it("ships an app icon so the browser tab is branded, not blank", () => {
    // The `app/icon.svg` file convention makes Next.js emit the favicon link; the
    // export therefore carries an icon for GitHub Pages to serve under the base path.
    expect(existsSync(resolve(repoRoot, "src/app/icon.svg"))).toBe(true);
  });
});

describe("GitHub Pages deployment workflow", () => {
  it("runs on pushes to main and on manual dispatch", () => {
    expect(deploy).toMatch(/^on:/m);
    expect(deploy).toMatch(/branches:\s*\[main\]/);
    expect(deploy).toMatch(/workflow_dispatch:/);
  });

  it("requests the Pages deployment permissions", () => {
    expect(deploy).toMatch(/^permissions:/m);
    expect(deploy).toMatch(/^\s+contents:\s*read\s*$/m);
    expect(deploy).toMatch(/^\s+pages:\s*write\s*$/m);
    expect(deploy).toMatch(/^\s+id-token:\s*write\s*$/m);
  });

  it("builds the export and publishes only the generated output", () => {
    expect(deploy).toMatch(/actions\/configure-pages@/);
    expect(deploy).toMatch(/actions\/upload-pages-artifact@/);
    expect(deploy).toMatch(/path:\s*\.\/out/);
    expect(deploy).toMatch(/actions\/deploy-pages@/);
    // The Pages sub-path must be fed to the build from configure-pages.
    expect(deploy).toMatch(/PAGES_BASE_PATH:\s*\$\{\{\s*steps\.setup_pages\.outputs\.base_path\s*\}\}/);
  });

  it("guards against publishing the repository source or documentation", () => {
    // A verification step fails the build if the export is missing or is docs.
    expect(deploy).toMatch(/out\/index\.html/);
    expect(deploy).toMatch(/out\/README\.md/);
  });

  it("does not depend on repository secrets", () => {
    expect(deploy).not.toMatch(/\$\{\{\s*secrets\./);
  });
});
