/**
 * Post-merge reconciliation tests.
 *
 * Each test builds an isolated scratch repository, runs the real reconcile CLI
 * against a recorded GitHub API shape (via a preloaded fetch stub), and asserts on
 * the resulting state/queue files. This exercises the real code path — no mocks of
 * the reconciliation logic itself.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { allowedNext } from "../../.ai/scripts/lib/loop-state.mjs";
import { nextTaskId, phaseAfter, readRoadmap } from "../../.ai/scripts/lib/next-task.mjs";
import { aggregateCi, pathToNextPhase } from "../../.ai/scripts/lib/reconcile.mjs";
import {
  MERGED_INV001,
  REAL_ROOT,
  fileExists,
  makeScratch,
  readJsonFile,
  readTextFile,
  runScript,
  writeScenario,
} from "./helpers/loop-harness.mjs";

let dir;

const repoConfig = JSON.parse(readFileSync(join(REAL_ROOT, ".ai/loop.config.json"), "utf8"));
const readConfig = () => readJsonFile(dir, ".ai/loop.config.json");
const state = () => readJsonFile(dir, ".ai/state/loop-state.json");
const queue = () => readJsonFile(dir, ".ai/state/task-queue.json");

beforeEach(() => {
  dir = makeScratch();
});

const reconcile = (args = []) => {
  const scenario = writeScenario(dir, MERGED_INV001);
  return runScript(dir, ".ai/scripts/reconcile.mjs", ["--json", ...args], { scenario });
};

const writeJson = (name, value) => {
  const path = join(dir, name);
  writeFileSync(path, JSON.stringify(value));
  return path;
};

const validTask = (overrides = {}) => ({
  id: "INV-002",
  title: "Visual System Foundation",
  phase: "Phase 2 — Visual System",
  status: "PLANNED",
  summary: "Establish typography, colour, spacing and motion primitives.",
  acceptanceCriteria: ["Define design tokens"],
  outOfScope: ["Hero animation"],
  dependsOn: ["INV-001"],
  createdAt: "2026-10-05T08:00:00Z",
  ...overrides,
});

describe("pathToNextPhase", () => {
  it("returns a fully legal path from PLANNED to NEXT_PHASE", () => {
    const path = pathToNextPhase(repoConfig, "PLANNED");
    expect(path).not.toBeNull();
    expect(path[path.length - 1]).toBe("NEXT_PHASE");
    let from = "PLANNED";
    for (const to of path) {
      expect(allowedNext(repoConfig, from)).toContain(to);
      from = to;
    }
  });

  it("contains every gate state and never omits one", () => {
    const path = pathToNextPhase(repoConfig, "PLANNED");
    for (const gate of ["IMPLEMENTING", "TESTING", "ANTISLOP_REVIEW", "CHATGPT_REVIEW", "APPROVED", "MERGED"]) {
      expect(path).toContain(gate);
    }
  });

  it("continues correctly from a mid-flight state", () => {
    expect(pathToNextPhase(repoConfig, "TESTING")[0]).toBe("ANTISLOP_REVIEW");
  });
});

describe("aggregateCi", () => {
  it("reports success, failure, pending and none honestly", () => {
    expect(aggregateCi([])).toBe("none");
    expect(aggregateCi([{ status: "completed", conclusion: "success" }])).toBe("success");
    expect(aggregateCi([{ status: "completed", conclusion: "failure" }])).toBe("failure");
    expect(aggregateCi([{ status: "in_progress", conclusion: null }])).toBe("pending");
  });

  it("ignores the reconciliation job's own check run", () => {
    // The reconciliation workflow runs on the merged head and creates a check run
    // there; its result must never be read as the task's CI.
    expect(
      aggregateCi([
        { name: "Lint, typecheck, test, build", status: "completed", conclusion: "success" },
        { name: "Reconcile merged task", status: "completed", conclusion: "failure" },
      ]),
    ).toBe("success");
    // A lone reconciliation check leaves no task CI evidence at all.
    expect(aggregateCi([{ name: "Reconcile merged task", status: "completed", conclusion: "failure" }])).toBe("none");
  });
});

describe("roadmap", () => {
  it("resolves the phase that follows the completed phase", () => {
    const roadmap = readRoadmap(repoConfig);
    expect(roadmap.map((p) => p.number)).toContain(2);
    expect(roadmap.find((p) => p.number === 2).name).toMatch(/Visual System/);
    expect(phaseAfter(repoConfig, "P1 Foundation")).toMatch(/Phase 2/);
  });
});

describe("task id sequencing", () => {
  it("increments to INV-002 after INV-001", () => {
    expect(nextTaskId(repoConfig, { tasks: [{ id: "INV-001" }] })).toBe("INV-002");
    expect(nextTaskId(repoConfig, { tasks: [{ id: "INV-001" }, { id: "INV-002" }] })).toBe("INV-003");
  });
});

describe("successful reconciliation", () => {
  it("verifies the merge, completes INV-001 and reaches NEXT_PHASE", () => {
    const result = reconcile(["--pr", "1"]);
    expect(result.ok).toBe(true);

    const s = state();
    expect(s.status).toBe("NEXT_PHASE");
    expect(s.completedTasks).toEqual(["INV-001"]);
    expect(s.lastMerge.prNumber).toBe(1);
    expect(s.lastMerge.headSha).toBe(MERGED_INV001.pull.head.sha);
    expect(s.lastMerge.mergeCommit).toBe(MERGED_INV001.pull.merge_commit_sha);
    expect(s.nextTask.status).toBe("requested");
    expect(s.nextTask.taskId).toBe("INV-002");
  });

  it("records the whole legal state sequence in history", () => {
    reconcile(["--pr", "1"]);
    const s = state();
    const path = pathToNextPhase(readConfig(), "PLANNED");
    const recorded = s.history.map((h) => h.to);
    for (const step of path) expect(recorded).toContain(step);
    for (const entry of s.history) {
      if (entry.from === null || entry.from === entry.to) continue;
      expect(allowedNext(readConfig(), entry.from)).toContain(entry.to);
    }
  });

  it("keeps the queue consistent with loop state", () => {
    reconcile(["--pr", "1"]);
    const inv001 = queue().tasks.find((t) => t.id === "INV-001");
    expect(inv001.status).toBe("NEXT_PHASE");
  });

  it("writes a next-task request naming the correct next phase and id", () => {
    reconcile(["--pr", "1"]);
    expect(fileExists(dir, ".ai/state/next-task-request.json")).toBe(true);
    const request = readJsonFile(dir, ".ai/state/next-task-request.json");
    expect(request.suggestedId).toBe("INV-002");
    expect(request.phase).toMatch(/Phase 2/);
    expect(request.afterTaskId).toBe("INV-001");
    expect(request.authority.provider).toBe("openhands");
  });

  it("discovers the merged PR without an explicit --pr when currentPr is null", () => {
    const result = reconcile([]);
    expect(result.ok).toBe(true);
    expect(state().lastMerge.prNumber).toBe(1);
  });

  it("leaves state that passes the loop-config validator", () => {
    reconcile(["--pr", "1"]);
    const validation = runScript(dir, ".ai/scripts/validate-loop-config.mjs", ["--json"]);
    expect(validation.ok).toBe(true);
    expect(JSON.parse(validation.stdout).ok).toBe(true);
  });
});

describe("failure behaviour", () => {
  const reconcileWith = (pull, extra = {}) => {
    const scenario = writeScenario(dir, { ...MERGED_INV001, pull, ...extra });
    return runScript(dir, ".ai/scripts/reconcile.mjs", ["--pr", "1", "--json"], { scenario });
  };

  it("refuses when the PR is not merged", () => {
    const result = reconcileWith({ ...MERGED_INV001.pull, state: "OPEN", merged_at: null });
    expect(result.ok).toBe(false);
    expect(state().status).toBe("PLANNED");
    expect(state().completedTasks).toEqual([]);
  });

  it("treats a PR for a different task as unrelated and does not mutate state", () => {
    const result = reconcileWith({
      ...MERGED_INV001.pull,
      head: { sha: MERGED_INV001.pull.head.sha, ref: "automation/inv-999-foundation" },
    });
    expect(result.ok).toBe(true);
    expect(JSON.parse(result.stdout).status).toBe("unrelated");
    expect(state().status).toBe("PLANNED");
    expect(state().completedTasks).toEqual([]);
  });

  it("falls back to discovery when the event PR is unrelated", () => {
    // The event names PR #99 (unrelated), but INV-001's real PR #1 is merged.
    const scenario = writeScenario(dir, {
      ...MERGED_INV001,
      pull: { number: 99, state: "MERGED", merged_at: "2026-10-05T07:30:00Z", head: { sha: MERGED_INV001.pull.head.sha, ref: "docs/fix" }, base: { ref: "main" } },
      pulls: [MERGED_INV001.pull],
    });
    const result = runScript(dir, ".ai/scripts/reconcile.mjs", ["--pr", "99", "--json"], { scenario });
    expect(result.ok).toBe(true);
    expect(JSON.parse(result.stdout).prNumber).toBe(1);
    expect(state().status).toBe("NEXT_PHASE");
    expect(state().completedTasks).toEqual(["INV-001"]);
  });

  it("refuses when the merge commit cannot be verified", () => {
    const result = reconcileWith(MERGED_INV001.pull, {
      commit: { sha: "0000000000000000000000000000000000000000" },
    });
    expect(result.ok).toBe(false);
    expect(state().status).toBe("PLANNED");
  });

  it("refuses when CI on the merged head failed", () => {
    const result = reconcileWith(MERGED_INV001.pull, {
      checkRuns: [{ name: "Lint, typecheck, test, build", status: "completed", conclusion: "failure" }],
    });
    expect(result.ok).toBe(false);
    expect(state().status).toBe("PLANNED");
  });

  it("refuses a PR that does not match the recorded currentPr", () => {
    // Move the loop to READY and record a different PR, then try to reconcile #1.
    // The branch still matches, so this is the recorded-number conflict path.
    runScript(dir, ".ai/scripts/loop-state.mjs", ["set", "--status", "READY", "--pr", "7"]);
    const result = reconcile(["--pr", "1"]);
    expect(result.ok).toBe(false);
    expect(state().currentPr).toBe(7);
  });

  it("reports a benign no-op when no merged PR exists for the task", () => {
    const scenario = writeScenario(dir, { ...MERGED_INV001, pulls: [] });
    const result = runScript(dir, ".ai/scripts/reconcile.mjs", ["--json"], { scenario });
    expect(result.ok).toBe(true);
    expect(JSON.parse(result.stdout).status).toBe("nothing-to-do");
    expect(state().status).toBe("PLANNED");
  });

  it("is a no-op in dry-run mode", () => {
    const result = reconcile(["--pr", "1", "--dry-run"]);
    expect(result.ok).toBe(true);
    expect(JSON.parse(result.stdout).dryRun).toBe(true);
    expect(state().status).toBe("PLANNED");
  });
});

describe("idempotency", () => {
  it("running reconciliation three times produces no additional change", () => {
    reconcile(["--pr", "1"]);
    const first = JSON.stringify({ state: state(), queue: queue() });

    const second = reconcile(["--pr", "1"]);
    const third = reconcile(["--pr", "1"]);
    expect(second.ok).toBe(true);
    expect(third.ok).toBe(true);
    expect(JSON.parse(second.stdout).status).toBe("already-reconciled");

    expect(JSON.stringify({ state: state(), queue: queue() })).toBe(first);
    expect(state().completedTasks).toEqual(["INV-001"]);
    expect(queue().tasks).toHaveLength(1);
  });

  it("does not duplicate the next-task request", () => {
    reconcile(["--pr", "1"]);
    const request = JSON.stringify(readJsonFile(dir, ".ai/state/next-task-request.json"));
    reconcile(["--pr", "1"]);
    expect(JSON.stringify(readJsonFile(dir, ".ai/state/next-task-request.json"))).toBe(request);
  });

  it("blocks idempotently when no next phase is defined", () => {
    // Remove the following phase from the roadmap so generation cannot proceed.
    const phasesPath = join(dir, "docs/PHASES.md");
    const trimmed = readFileSync(phasesPath, "utf8").replace(/## Phase 2[\s\S]*?(?=## Phase 3)/, "");
    writeFileSync(phasesPath, trimmed);

    reconcile(["--pr", "1"]);
    const afterFirst = JSON.stringify(state());
    expect(state().nextTask.status).toBe("failed");
    expect(state().completedTasks).toEqual(["INV-001"]);
    expect(fileExists(dir, ".ai/state/next-task-request.json")).toBe(false);

    reconcile(["--pr", "1"]);
    expect(JSON.stringify(state())).toBe(afterFirst);
  });

  it("completes a part-way reconciliation (stopped at MERGED) without duplicating", () => {
    reconcile(["--pr", "1"]);
    // Simulate a crash that only persisted the MERGED transition: rewind to MERGED
    // with the completed task already recorded.
    const s = state();
    const rewind = {
      ...s,
      status: "MERGED",
      nextTask: null,
      history: s.history.filter((h) => h.to !== "NEXT_PHASE"),
    };
    writeFileSync(join(dir, ".ai/state/loop-state.json"), `${JSON.stringify(rewind, null, 2)}\n`);

    const result = reconcile(["--pr", "1"]);
    expect(result.ok).toBe(true);
    expect(state().status).toBe("NEXT_PHASE");
    expect(state().completedTasks).toEqual(["INV-001"]);
  });
});

describe("reconciliation deadlock recovery", () => {
  /**
   * The reconciliation job runs on the merged head and creates a check run there. If
   * that job fails (for example because its state push raced the autopilot stage) the
   * failure is recorded on the merged head SHA — and the reconciled state is lost. A
   * later run must still be able to complete the task from the other real CI evidence,
   * and must not be blocked by the reconciliation job's own failed check.
   */
  const mergeWithFailedReconcile = () => {
    const scenario = writeScenario(dir, {
      ...MERGED_INV001,
      checkRuns: [
        { name: "Lint, typecheck, test, build", status: "completed", conclusion: "success" },
        { name: "End-to-end tests", status: "completed", conclusion: "success" },
        { name: "Reconcile merged task", status: "completed", conclusion: "failure" },
      ],
    });
    return runScript(dir, ".ai/scripts/reconcile.mjs", ["--pr", "1", "--json"], { scenario });
  };

  it("recovers a lost reconciliation whose own job check failed", () => {
    const result = mergeWithFailedReconcile();
    expect(result.ok).toBe(true);
    expect(JSON.parse(result.stdout).status).toBe("reconciled");

    const s = state();
    expect(s.status).toBe("NEXT_PHASE");
    expect(s.completedTasks).toEqual(["INV-001"]);
    // The merge evidence records the *task's* CI, not the reconciliation job's result.
    expect(s.lastMerge.ciStatus).toBe("success");
    expect(s.nextTask.status).toBe("requested");
    expect(s.nextTask.taskId).toBe("INV-002");
  });

  it("still refuses when the task's own CI genuinely failed", () => {
    const scenario = writeScenario(dir, {
      ...MERGED_INV001,
      checkRuns: [
        { name: "Lint, typecheck, test, build", status: "completed", conclusion: "failure" },
        { name: "Reconcile merged task", status: "completed", conclusion: "success" },
      ],
    });
    const result = runScript(dir, ".ai/scripts/reconcile.mjs", ["--pr", "1", "--json"], { scenario });
    expect(result.ok).toBe(false);
    expect(JSON.parse(result.stdout).error).toMatch(/failing CI checks.*Lint, typecheck, test, build/);
    expect(state().status).toBe("PLANNED");
    expect(state().completedTasks).toEqual([]);
  });
});

describe("next-task generation", () => {
  it("applies a valid authority brief and moves NEXT_PHASE -> READY", () => {
    reconcile(["--pr", "1"]);
    const file = writeJson("task.json", validTask());
    const brief = join(dir, "brief.md");
    writeFileSync(brief, "# INV-002\n");

    const result = runScript(dir, ".ai/scripts/next-task.mjs", ["apply", "--file", file, "--brief", brief, "--json"]);
    expect(result.ok).toBe(true);
    expect(state().status).toBe("READY");
    expect(state().currentTaskId).toBe("INV-002");
    expect(queue().tasks.map((t) => t.id)).toEqual(["INV-001", "INV-002"]);
    expect(readTextFile(dir, ".ai/tasks/INV-002.md")).toContain("INV-002");
  });

  it("is idempotent when the same brief is applied twice", () => {
    reconcile(["--pr", "1"]);
    const file = writeJson("task.json", validTask());
    const brief = join(dir, "brief.md");
    writeFileSync(brief, "# INV-002\n");
    runScript(dir, ".ai/scripts/next-task.mjs", ["apply", "--file", file, "--brief", brief]);
    const first = JSON.stringify({ state: state(), queue: queue() });
    const again = runScript(dir, ".ai/scripts/next-task.mjs", ["apply", "--file", file, "--brief", brief, "--json"]);
    expect(again.ok).toBe(true);
    expect(JSON.parse(again.stdout).applied).toBe(false);
    expect(JSON.stringify({ state: state(), queue: queue() })).toBe(first);
  });

  it("refuses a brief whose phase is not the next roadmap phase", () => {
    reconcile(["--pr", "1"]);
    const file = writeJson("task.json", validTask({ phase: "Phase 5 — Temple Experience" }));
    const result = runScript(dir, ".ai/scripts/next-task.mjs", ["apply", "--file", file]);
    expect(result.ok).toBe(false);
    expect(state().status).toBe("NEXT_PHASE");
  });

  it("refuses to apply an invalid (schema-breaking) brief", () => {
    reconcile(["--pr", "1"]);
    const file = writeJson("task.json", { id: "INV-002", title: "Incomplete" });
    const result = runScript(dir, ".ai/scripts/next-task.mjs", ["apply", "--file", file]);
    expect(result.ok).toBe(false);
    expect(state().status).toBe("NEXT_PHASE");
  });

  it("refuses to apply a duplicate task id", () => {
    reconcile(["--pr", "1"]);
    const file = writeJson("task.json", validTask({ id: "INV-001" }));
    const result = runScript(dir, ".ai/scripts/next-task.mjs", ["apply", "--file", file]);
    expect(result.ok).toBe(false);
  });
});

afterEach(() => {
  dir = undefined;
});
