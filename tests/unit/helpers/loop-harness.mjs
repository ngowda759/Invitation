/**
 * Test harness: builds an isolated scratch copy of the repository's automation
 * surface (`.ai`, `docs`, `.github`, `package.json`) and runs the real CLI scripts
 * against it, so tests exercise real code paths rather than mocks.
 */
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REAL_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const STUB = join(REAL_ROOT, "tests", "unit", "helpers", "github-stub.mjs");
const OPENHANDS_STUB = join(REAL_ROOT, "tests", "unit", "helpers", "openhands-stub.mjs");

/**
 * Seed the scratch repo with a deterministic starting point: the loop at PLANNED
 * with only the first task queued and no pending request. This makes the state
 * machine tests independent of the live loop state committed on `main`.
 */
function seedInitialState(dir) {
  const config = JSON.parse(readFileSync(join(dir, ".ai/loop.config.json"), "utf8"));
  const queue = JSON.parse(readFileSync(join(dir, ".ai/state/task-queue.json"), "utf8"));
  const firstTaskId = config.project.firstTaskId;
  const first = queue.tasks.find((t) => t.id === firstTaskId);

  const state = {
    version: 1,
    updatedAt: "2026-10-05T00:00:00.000Z",
    status: "PLANNED",
    currentTaskId: firstTaskId,
    round: 0,
    maxReviewRounds: config.limits.maxReviewRounds,
    currentPr: null,
    reviewedHeadSha: null,
    lastVerdict: null,
    lastCiStatus: null,
    blockedReason: null,
    lastMerge: null,
    nextTask: null,
    completedTasks: [],
    history: [
      {
        at: "2026-10-05T00:00:00.000Z",
        from: null,
        to: "PLANNED",
        note: "Scratch seed: loop at PLANNED with the first task only.",
      },
    ],
  };
  const seededQueue = {
    version: 1,
    updatedAt: "2026-10-05T00:00:00.000Z",
    tasks: [{ ...first, status: "PLANNED" }],
  };

  writeFileSync(join(dir, ".ai/state/loop-state.json"), `${JSON.stringify(state, null, 2)}\n`);
  writeFileSync(join(dir, ".ai/state/task-queue.json"), `${JSON.stringify(seededQueue, null, 2)}\n`);
  for (const generated of [
    ".ai/state/next-task-request.json",
    ".ai/state/openhands-dispatch.json",
    ".ai/state/antislop-report.json",
  ]) {
    rmSync(join(dir, generated), { force: true });
  }
}

/** Create a scratch repository containing the automation files. */
export function makeScratch() {
  const dir = mkdtempSync(join(tmpdir(), "invitation-loop-"));
  for (const entry of [".ai", "docs", ".github", "package.json", "README.md"]) {
    cpSync(join(REAL_ROOT, entry), join(dir, entry), { recursive: true });
  }
  seedInitialState(dir);
  return dir;
}

/** Write a fake-GitHub scenario file and return its path. */
export function writeScenario(dir, scenario) {
  const path = join(dir, "scenario.json");
  writeFileSync(path, JSON.stringify(scenario));
  return path;
}

/** Write a fake-OpenHands scenario file and return its path. */
export function writeOpenHandsScenario(dir, scenario) {
  const path = join(dir, "openhands-scenario.json");
  writeFileSync(path, JSON.stringify(scenario));
  return path;
}

/** Run one of the real scripts inside the scratch repo. */
export function runScript(dir, script, args = [], { scenario, openhands, env: extraEnv } = {}) {
  const env = { ...process.env, GITHUB_REPOSITORY: "ngowda759/Invitation" };
  delete env.GITHUB_TOKEN;
  delete env.GH_TOKEN;
  delete env.OPENHANDS_API_KEY;
  delete env.OPENHANDS_HOST;
  const nodeArgs = [];
  if (scenario) {
    env.INVITATION_FAKE_GITHUB = scenario;
    nodeArgs.push("--import", STUB);
  }
  if (openhands) {
    env.INVITATION_FAKE_OPENHANDS = openhands;
    nodeArgs.push("--import", OPENHANDS_STUB);
  }
  if (extraEnv) Object.assign(env, extraEnv);
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

/** Write a JSON file inside the scratch repo. */
export function writeJsonFile(dir, relative, value) {
  writeFileSync(join(dir, relative), `${JSON.stringify(value, null, 2)}\n`);
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
