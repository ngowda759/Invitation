/**
 * Test harness: builds an isolated scratch copy of the repository's automation
 * surface (`.ai`, `docs`, `.github`, `package.json`) and runs the real CLI scripts
 * against it, so tests exercise real code paths rather than mocks.
 */
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REAL_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const STUB = join(REAL_ROOT, "tests", "unit", "helpers", "github-stub.mjs");

/** Create a scratch repository containing the automation files. */
export function makeScratch() {
  const dir = mkdtempSync(join(tmpdir(), "invitation-loop-"));
  for (const entry of [".ai", "docs", ".github", "package.json", "README.md"]) {
    cpSync(join(REAL_ROOT, entry), join(dir, entry), { recursive: true });
  }
  return dir;
}

/** Write a fake-GitHub scenario file and return its path. */
export function writeScenario(dir, scenario) {
  const path = join(dir, "scenario.json");
  writeFileSync(path, JSON.stringify(scenario));
  return path;
}

/** Run one of the real scripts inside the scratch repo. */
export function runScript(dir, script, args = [], { scenario } = {}) {
  const env = { ...process.env, GITHUB_REPOSITORY: "ngowda759/Invitation" };
  delete env.GITHUB_TOKEN;
  delete env.GH_TOKEN;
  const nodeArgs = [];
  if (scenario) {
    env.INVITATION_FAKE_GITHUB = scenario;
    nodeArgs.push("--import", STUB);
  }
  nodeArgs.push(join(dir, script), ...args);
  try {
    const stdout = execFileSync("node", nodeArgs, { cwd: dir, env, encoding: "utf8" });
    return { ok: true, stdout };
  } catch (error) {
    return { ok: false, stdout: error.stdout ?? "", stderr: error.stderr ?? "", status: error.status };
  }
}

export function readJsonFile(dir, relative) {
  return JSON.parse(readFileSync(join(dir, relative), "utf8"));
}

export function readTextFile(dir, relative) {
  return readFileSync(join(dir, relative), "utf8");
}

export function fileExists(dir, relative) {
  try {
    readFileSync(join(dir, relative));
    return true;
  } catch {
    return false;
  }
}

/** A realistic merged-PR scenario for INV-001 (real SHAs used as fixtures). */
export const MERGED_INV001 = {
  pull: {
    number: 1,
    state: "MERGED",
    merged_at: "2026-10-05T07:24:21Z",
    merge_commit_sha: "9cab21550525c52f8e436692d402750c9a4fa1c1",
    head: { sha: "d1b6b347ae4a015d30e6b2f1a23e878e263ece18", ref: "automation/inv-001-foundation" },
    base: { ref: "main" },
    title: "Initialize Invitation foundation and native automation architecture (INV-001)",
    html_url: "https://github.com/ngowda759/Invitation/pull/1",
  },
  commit: {
    sha: "9cab21550525c52f8e436692d402750c9a4fa1c1",
    commit: { committer: { date: "2026-10-05T07:24:21Z" } },
  },
  checkRuns: [
    { name: "Lint, typecheck, test, build", status: "completed", conclusion: "success" },
    { name: "AntiSlop quality gate", status: "completed", conclusion: "success" },
  ],
};

export { REAL_ROOT };
