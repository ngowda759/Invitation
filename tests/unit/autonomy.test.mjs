/**
 * Autonomous loop tests.
 *
 * Exercises the real code path end to end against a scratch repository and a
 * recorded OpenHands API shape: merge reconciliation -> NEXT_PHASE -> autonomous
 * task generation -> READY -> OpenHands dispatch. Covers the acceptance criteria:
 * generation, duplicate protection, dispatch protection, missing credentials,
 * successful dispatch and the full transition.
 */
import { existsSync } from "node:fs";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  MERGED_INV001,
  fileExists,
  makeScratch,
  readJsonFile,
  readTextFile,
  runScript,
  writeJsonFile,
  writeOpenHandsScenario,
  writeScenario,
} from "./helpers/loop-harness.mjs";

let dir;

beforeEach(() => {
  dir = makeScratch();
});

const state = () => readJsonFile(dir, ".ai/state/loop-state.json");
const queue = () => readJsonFile(dir, ".ai/state/task-queue.json");
const request = () => readJsonFile(dir, ".ai/state/next-task-request.json");

const reconcile = () => {
  const scenario = writeScenario(dir, MERGED_INV001);
  return runScript(dir, ".ai/scripts/reconcile.mjs", ["--pr", "1", "--json"], { scenario });
};

const generate = (args = []) => runScript(dir, ".ai/scripts/next-task.mjs", ["generate", "--json", ...args]);

const OK_START = { id: "start-abc", app_conversation_id: "conv-abc", status: "READY" };

const countPath = () => `${dir}/openhands-posts.txt`;
const postCount = () =>
  existsSync(countPath()) ? readTextFile(dir, "openhands-posts.txt").trim().split("\n").filter(Boolean).length : 0;

const withKey = () => ({ OPENHANDS_API_KEY: "test-key", INVITATION_OPENHANDS_COUNT: countPath() });
const withoutKey = () => ({ INVITATION_OPENHANDS_COUNT: countPath() });

const dispatch = (start, { args = ["--json"], env = withKey() } = {}) => {
  const scenario = writeOpenHandsScenario(dir, { start });
  return runScript(dir, ".ai/scripts/openhands-dispatch.mjs", args, { openhands: scenario, env });
};

describe("1. next-task generation", () => {
  it("turns NEXT_PHASE + request into INV-002 / Phase 2 through the state machine", () => {
    reconcile();
    expect(state().status).toBe("NEXT_PHASE");

    const result = generate();
    expect(result.ok).toBe(true);
    const body = JSON.parse(result.stdout);
    expect(body.status).toBe("generated");
    expect(body.taskId).toBe("INV-002");
    expect(body.phase).toMatch(/Phase 2/);

    expect(state().status).toBe("READY");
    expect(state().currentTaskId).toBe("INV-002");
    const inv002 = queue().tasks.find((t) => t.id === "INV-002");
    expect(inv002.phase).toBe("Phase 2 — Visual System");
    expect(inv002.dependsOn).toEqual(["INV-001"]);
    expect(inv002.acceptanceCriteria.length).toBeGreaterThan(0);
    expect(inv002.outOfScope.join(" ")).toMatch(/database/i);

    // The Markdown brief is written and derived from docs/PHASES.md.
    expect(fileExists(dir, ".ai/tasks/INV-002.md")).toBe(true);
    const brief = readTextFile(dir, ".ai/tasks/INV-002.md");
    expect(brief).toContain("typography");
    expect(brief).toContain("design review");
  });

  it("leaves state that passes the loop-config validator", () => {
    reconcile();
    generate();
    const validation = runScript(dir, ".ai/scripts/validate-loop-config.mjs", ["--json"]);
    expect(validation.ok).toBe(true);
    expect(JSON.parse(validation.stdout).ok).toBe(true);
  });

  it("blocks instead of inventing a task when the phase is not in the roadmap", () => {
    reconcile();
    // Point the request at a phase the roadmap does not define.
    const req = request();
    req.phase = "Phase 99 — Invented";
    writeJsonFile(dir, ".ai/state/next-task-request.json", req);
    const result = generate();
    expect(result.ok).toBe(false);
    expect(JSON.parse(result.stdout).status).toBe("blocked");
    expect(state().status).toBe("NEXT_PHASE");
    expect(state().blockedReason).toMatch(/not in docs\/PHASES.md/i);
  });
});

describe("2. duplicate protection", () => {
  it("running the generator twice never creates two INV-002 tasks", () => {
    reconcile();
    generate();
    const first = JSON.stringify({ state: state(), queue: queue() });

    const second = generate();
    expect(second.ok).toBe(true);
    expect(JSON.parse(second.stdout).status).toBe("already-generated");
    expect(JSON.stringify({ state: state(), queue: queue() })).toBe(first);
    expect(queue().tasks.filter((t) => t.id === "INV-002")).toHaveLength(1);
  });
});

describe("3. dispatch protection", () => {
  it("dispatching twice for INV-002 creates one OpenHands conversation", () => {
    reconcile();
    generate();

    const first = dispatch(OK_START);
    expect(first.ok).toBe(true);
    expect(JSON.parse(first.stdout).status).toBe("dispatched");
    expect(postCount()).toBe(1);

    const second = dispatch(OK_START);
    expect(second.ok).toBe(true);
    expect(JSON.parse(second.stdout).status).toBe("already-dispatched");
    expect(postCount()).toBe(1);
  });
});

describe("4. missing credentials", () => {
  it("records a blocked dispatch and never fabricates success", () => {
    reconcile();
    generate();
    const result = dispatch(OK_START, { env: withoutKey() });
    expect(result.ok).toBe(false);
    expect(JSON.parse(result.stdout).status).toBe("blocked");
    expect(postCount()).toBe(0);

    const record = readJsonFile(dir, ".ai/state/openhands-dispatch.json");
    expect(record.status).toBe("blocked");
    expect(record.conversationId).toBeNull();
    expect(record.reason).toMatch(/OPENHANDS_API_KEY/);
  });
});

describe("5. successful dispatch", () => {
  it("records a dispatch with the conversation id from the mocked API", () => {
    reconcile();
    generate();
    const result = dispatch(OK_START);
    expect(result.ok).toBe(true);

    const record = readJsonFile(dir, ".ai/state/openhands-dispatch.json");
    expect(record.status).toBe("dispatched");
    expect(record.taskId).toBe("INV-002");
    expect(record.conversationId).toBe("conv-abc");
    expect(record.startTaskId).toBe("start-abc");
    expect(record.sourceState).toBe("READY");
    expect(record.dispatchedAt).toBeTruthy();
  });

  it("records a blocked dispatch when the API rejects the request", () => {
    reconcile();
    generate();
    const scenario = writeOpenHandsScenario(dir, { fail: "boom", failStatus: 500 });
    const result = runScript(dir, ".ai/scripts/openhands-dispatch.mjs", ["--json"], { openhands: scenario, env: withKey() });
    expect(result.ok).toBe(false);
    expect(readJsonFile(dir, ".ai/state/openhands-dispatch.json").status).toBe("blocked");
  });
});

describe("6. full transition", () => {
  it("NEXT_PHASE -> generated -> READY -> dispatched", () => {
    reconcile();
    expect(state().status).toBe("NEXT_PHASE");
    expect(state().nextTask.status).toBe("requested");

    generate();
    expect(state().status).toBe("READY");
    expect(state().currentTaskId).toBe("INV-002");
    expect(queue().tasks.map((t) => t.id)).toEqual(["INV-001", "INV-002"]);

    const result = dispatch(OK_START);
    expect(result.ok).toBe(true);
    expect(JSON.parse(result.stdout).status).toBe("dispatched");

    // The whole transition is recorded in history and remains legal.
    const path = state().history.map((h) => h.to);
    expect(path).toContain("NEXT_PHASE");
    expect(path).toContain("READY");
    expect(state().nextTask.status).toBe("applied");
  });

  it("dispatches the NEXT_PHASE generation request before a task exists", () => {
    reconcile();
    // At NEXT_PHASE there is no task yet; the worker is dispatched to generate one.
    const result = dispatch(OK_START);
    expect(result.ok).toBe(true);
    const body = JSON.parse(result.stdout);
    expect(body.status).toBe("dispatched");
    expect(body.sourceState).toBe("NEXT_PHASE");
    expect(body.taskId).toBe("INV-002");
  });

  it("dry-run performs no write and sends no request", () => {
    reconcile();
    const result = dispatch(OK_START, { args: ["--json", "--dry-run"] });
    expect(result.ok).toBe(true);
    expect(JSON.parse(result.stdout).status).toBe("would-dispatch");
    expect(postCount()).toBe(0);
    expect(fileExists(dir, ".ai/state/openhands-dispatch.json")).toBe(false);
  });
});

afterEach(() => {
  dir = undefined;
});
