/**
 * Tests for the Invitation automation foundation: the schema validator, the
 * loop configuration, the state machine, and the task queue. Schema and validator
 * are designed together and tested together.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { validate } from "../../.ai/scripts/lib/schema.mjs";
import { allowedNext } from "../../.ai/scripts/lib/loop-state.mjs";
import { makeScratch, readJsonFile } from "./helpers/loop-harness.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => JSON.parse(readFileSync(resolve(repoRoot, p), "utf8"));

const config = read(".ai/loop.config.json");
const configSchema = read(".ai/schemas/loop-config.schema.json");
const stateSchema = read(".ai/schemas/loop-state.schema.json");
const queueSchema = read(".ai/schemas/task-queue.schema.json");
const reviewSchema = read(".ai/schemas/review-report.schema.json");

// The loop state and queue are read from a deterministic scratch seed so these
// assertions do not depend on how far the live loop has progressed on `main`.
let scratch;
let state;
let queue;
beforeAll(() => {
  scratch = makeScratch();
  state = readJsonFile(scratch, ".ai/state/loop-state.json");
  queue = readJsonFile(scratch, ".ai/state/task-queue.json");
});
afterAll(() => {
  scratch = undefined;
});

describe("schema validator", () => {
  it("accepts a valid document", () => {
    expect(validate(configSchema, config)).toEqual([]);
  });

  it("reports a missing required property", () => {
    const broken = { ...config };
    delete broken.paths;
    expect(validate(configSchema, broken).some((e) => e.includes("paths"))).toBe(true);
  });

  it("reports an unexpected additional property", () => {
    const errors = validate(configSchema, { ...config, unexpected: true });
    expect(errors.some((e) => e.includes("unexpected"))).toBe(true);
  });

  it("enforces const and enum", () => {
    expect(validate({ const: 1 }, 2)).toHaveLength(1);
    expect(validate({ enum: ["A", "B"] }, "C")).toHaveLength(1);
    expect(validate({ enum: ["A", "B"] }, "A")).toHaveLength(0);
  });

  it("enforces pattern and minItems", () => {
    expect(validate({ type: "string", pattern: "^INV-" }, "INV-001")).toHaveLength(0);
    expect(validate({ type: "string", pattern: "^INV-" }, "AI-001")).toHaveLength(1);
    expect(validate({ type: "array", minItems: 2 }, [1])).toHaveLength(1);
  });
});

describe("loop configuration", () => {
  it("validates against its schema", () => {
    expect(validate(configSchema, config)).toEqual([]);
  });

  it("uses INV- as the task id prefix and INV-001 as the first task", () => {
    expect(config.project.taskIdPrefix).toBe("INV-");
    expect(config.project.firstTaskId).toBe("INV-001");
  });

  it("labels the reviewer as a machine reviewer, not ChatGPT", () => {
    expect(config.review.provider).toBe("openrouter");
    expect(config.review.note).toMatch(/machine reviewer/i);
    expect(config.review.note).toMatch(/never a ChatGPT review|not ChatGPT/i);
  });

  it("declares the required secrets without embedding credentials", () => {
    expect(config.secrets.required).toEqual(
      expect.arrayContaining(["OPENHANDS_API_KEY", "OPENROUTER_API_KEY"]),
    );
    const serialized = JSON.stringify(config);
    expect(serialized).not.toMatch(/gh[pousr]_[A-Za-z0-9]{20,}/);
    expect(serialized).not.toMatch(/sk-[A-Za-z0-9]{20,}/);
  });

  it("names OpenHands as the autonomous architecture worker, honestly marked non-human", () => {
    expect(config.architect.provider).toBe("openhands");
    expect(config.architect.note).toMatch(/autonomous worker|no human prompt|without a human prompt/i);
    expect(config.architect.prompt).toMatch(/^\.ai\/prompts\//);
  });
});

describe("state machine", () => {
  it("declares exactly the required states", () => {
    expect(config.stateMachine.states).toEqual([
      "PLANNED",
      "READY",
      "IMPLEMENTING",
      "TESTING",
      "ANTISLOP_REVIEW",
      "CHATGPT_REVIEW",
      "FIX_REQUIRED",
      "REVALIDATING",
      "APPROVED",
      "MERGED",
      "NEXT_PHASE",
    ]);
  });

  it("routes every state and never leaves a dead end", () => {
    for (const s of config.stateMachine.states) {
      expect(config.stateMachine.transitions).toHaveProperty(s);
    }
    expect(allowedNext(config, "FIX_REQUIRED")).toContain("REVALIDATING");
    expect(allowedNext(config, "MERGED")).toContain("NEXT_PHASE");
    expect(allowedNext(config, "APPROVED")).toContain("MERGED");
  });

  it("does not allow skipping a gate", () => {
    expect(allowedNext(config, "IMPLEMENTING")).not.toContain("APPROVED");
    expect(allowedNext(config, "TESTING")).not.toContain("APPROVED");
    expect(allowedNext(config, "ANTISLOP_REVIEW")).not.toContain("APPROVED");
  });

  it("state file status enum matches the config", () => {
    expect(stateSchema.properties.status.enum).toEqual(config.stateMachine.states);
    expect(queueSchema.properties.tasks.items.properties.status.enum).toEqual(
      config.stateMachine.states,
    );
  });
});

describe("loop state", () => {
  it("validates against its schema", () => {
    expect(validate(stateSchema, state)).toEqual([]);
  });

  it("starts at PLANNED with a recorded history entry", () => {
    expect(state.status).toBe("PLANNED");
    expect(state.history.length).toBeGreaterThan(0);
    expect(state.history[0].to).toBe("PLANNED");
  });

  it("matches the configured review round limit", () => {
    expect(state.maxReviewRounds).toBe(config.limits.maxReviewRounds);
  });

  it("records only legal transitions in history", () => {
    for (const entry of state.history) {
      if (entry.from === null || entry.from === entry.to) continue;
      expect(allowedNext(config, entry.from)).toContain(entry.to);
    }
  });
});

describe("task queue", () => {
  it("validates against its schema", () => {
    expect(validate(queueSchema, queue)).toEqual([]);
  });

  it("contains INV-001 as the only task", () => {
    expect(queue.tasks).toHaveLength(1);
    expect(queue.tasks[0].id).toBe("INV-001");
  });

  it("keeps out-of-scope guardrails for INV-001", () => {
    const inv001 = queue.tasks[0];
    const joined = inv001.outOfScope.join(" ").toLowerCase();
    for (const forbidden of ["database", "authentication", "raya ai", "hero animation"]) {
      expect(joined).toContain(forbidden);
    }
    expect(inv001.acceptanceCriteria.join(" ")).toMatch(/Playwright/);
  });
});

describe("review report schema", () => {
  it("requires isChatGpt to be false", () => {
    const valid = {
      version: 1,
      reviewer: { provider: "openrouter", model: "openrouter/free" },
      isChatGpt: false,
      verdict: "PASS",
      summary: "ok",
      findings: [],
    };
    expect(validate(reviewSchema, valid)).toEqual([]);

    const misrepresented = { ...valid, isChatGpt: true };
    expect(validate(reviewSchema, misrepresented).length).toBeGreaterThan(0);
  });
});
