/**
 * Phase 9 — Antislop.
 *
 * Exercises the real blocking gate (`.ai/scripts/antislop.mjs`) rather than a copy of
 * its rules: the whole repository must pass, and each narrow rule must still fire on a
 * scratch fixture so the gate cannot silently stop detecting slop.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, describe, expect, it } from "vitest";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SCRIPT = join(REPO_ROOT, ".ai/scripts/antislop.mjs");

/** Run the real gate against a repository root and return its parsed report. */
function runGate(repoRoot) {
  try {
    const stdout = execFileSync("node", [SCRIPT, "--json"], {
      cwd: REPO_ROOT,
      env: { ...process.env, INVITATION_REPO_ROOT: repoRoot },
      encoding: "utf8",
    });
    return JSON.parse(stdout);
  } catch (error) {
    // The gate exits non-zero when it reports an error; the JSON body is still valid.
    return JSON.parse((error).stdout ?? "{}");
  }
}

/** A minimal repository root the gate can scan. */
const scratchDirs = [];
function scratchRepo() {
  const dir = mkdtempSync(join(tmpdir(), "invitation-antislop-"));
  scratchDirs.push(dir);
  mkdirSync(join(dir, "src"), { recursive: true });
  mkdirSync(join(dir, ".ai/state"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "scratch", dependencies: {} }));
  return dir;
}

function writeSource(dir, rel, text) {
  const abs = join(dir, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, text);
  return dir;
}

afterAll(() => {
  for (const dir of scratchDirs) rmSync(dir, { recursive: true, force: true });
});

describe("the live repository", () => {
  it("passes the blocking gate with no error findings", () => {
    const report = runGate(REPO_ROOT);
    expect(report.result).toBe("PASS");
    expect(report.counts.error).toBe(0);
  });
});

describe("excessive animation", () => {
  it("rejects a constant looping animation", () => {
    const repo = writeSource(scratchRepo(), "src/loop.css", ".x { animation: spin 2s linear infinite; }\n");
    const report = runGate(repo);
    expect(report.result).toBe("FAIL");
    expect(report.findings.some((f) => f.rule === "excessive-animation")).toBe(true);
  });

  it("accepts a single, finite entrance animation", () => {
    const repo = writeSource(
      scratchRepo(),
      "src/entrance.css",
      ".x { animation: dissolve 1.2s ease-out 0.15s forwards; }\n",
    );
    expect(runGate(repo).findings.some((f) => f.rule === "excessive-animation")).toBe(false);
  });
});

describe("placeholder and dead-code guardrails", () => {
  it("rejects an explicit placeholder token", () => {
    const repo = writeSource(scratchRepo(), "src/content/placeholder.ts", "export const x = 'REPLACE_ME';\n");
    const report = runGate(repo);
    expect(report.findings.some((f) => f.rule === "placeholder-content")).toBe(true);
  });

  it("rejects an unnecessary heavyweight dependency", () => {
    const repo = scratchRepo();
    writeFileSync(
      join(repo, "package.json"),
      JSON.stringify({ name: "scratch", dependencies: { moment: "^2.0.0" } }),
    );
    const report = runGate(repo);
    expect(report.findings.some((f) => f.rule === "unnecessary-dependency")).toBe(true);
  });
});

describe("duplicate components", () => {
  const experienceDir = join(REPO_ROOT, "src/components/experience");

  it("renders Darshan and Festival entries through one shared list", () => {
    for (const name of ["DarshanSection.tsx", "FestivalSection.tsx"]) {
      const text = readFileSync(join(experienceDir, name), "utf8");
      expect(text, `${name} does not reuse the shared entry list`).toMatch(/EntryList/);
    }
  });

  it("defines the labelled-entry markup in exactly one place", () => {
    const owners = [];
    for (const name of readdirSync(experienceDir)) {
      if (!name.endsWith(".tsx")) continue;
      const text = readFileSync(join(experienceDir, name), "utf8");
      if (/<dt\b/.test(text)) owners.push(name);
    }
    expect(owners).toEqual(["EntryList.tsx"]);
  });
});

describe("content-section spacing rhythm", () => {
  // Every invitation content section opens its body with the same vertical rhythm
  // (mt-8) so spacing reads as intentional rather than ad hoc. The hero and event
  // identity are separate compositions with their own scale.
  const sectionFiles = [
    "DarshanSection.tsx",
    "FestivalSection.tsx",
    "ProgrammeTimeline.tsx",
    "RayaruSection.tsx",
    "SevaSection.tsx",
    "TempleMapSection.tsx",
    "GalleryExperience.tsx",
    "LocationSection.tsx",
    "ShareExperience.tsx",
  ].map((name) => join(REPO_ROOT, "src/components/experience", name));

  it("opens every section body with the same top-margin step", () => {
    for (const abs of sectionFiles) {
      const text = readFileSync(abs, "utf8");
      // The section owns mt-8 directly, or delegates the body to a shared component
      // (EntryList / ContentPlaceholder) that owns it. Either way the rendered
      // rhythm is a single mt-8 step and never drifts to mt-6.
      const ownsOrDelegates = /\bmt-8\b/.test(text) || /<(?:EntryList|ContentPlaceholder)\b/.test(text);
      expect(ownsOrDelegates, `${abs} does not use the shared mt-8 body rhythm`).toBe(true);
      expect(text, `${abs} drifts to a second body step`).not.toMatch(/\bmt-6\b/);
    }
  });

  it("owns the empty-state margin in the placeholder, not at each call site", () => {
    const placeholder = readFileSync(
      join(REPO_ROOT, "src/components/experience/ContentPlaceholder.tsx"),
      "utf8",
    );
    expect(placeholder).toMatch(/mt-8/);
    for (const abs of sectionFiles) {
      const text = readFileSync(abs, "utf8");
      expect(text, `${abs} overrides the placeholder margin`).not.toMatch(
        /<ContentPlaceholder[^>]*className=/,
      );
    }
  });
});
