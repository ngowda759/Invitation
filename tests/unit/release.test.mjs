/**
 * Release gate (Phase 10).
 *
 * Guards the release contract: every quality gate the phase promises is wired into
 * CI, CI stays read-only and secret-free, and the Phase 10 task is recorded with the
 * deliverables from `docs/PHASES.md`. These are deterministic invariants read from
 * the real files, so a later change cannot silently drop a gate from the pipeline.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => readFileSync(resolve(repoRoot, p), "utf8");

const config = JSON.parse(read(".ai/loop.config.json"));
const ci = read(config.ci.workflowFile);
const queue = JSON.parse(read(".ai/state/task-queue.json"));

describe("CI runs every configured gate", () => {
  it("declares the release gate steps in configuration", () => {
    for (const step of ["npm ci", "npm run lint", "npm run typecheck", "npm test", "npm run build"]) {
      expect(config.ci.requiredSteps).toContain(step);
    }
    // Phase 10 names e2e tests as a release deliverable, so e2e must be required.
    expect(config.ci.requiredSteps).toContain("npm run test:e2e");
  });

  it("actually runs each required step in the CI workflow", () => {
    for (const step of config.ci.requiredSteps) {
      expect(ci, `CI is missing required step: ${step}`).toContain(step);
    }
  });

  it("installs a browser so the e2e job cannot silently no-op", () => {
    expect(ci).toMatch(/npx playwright install/);
  });

  it("keeps CI read-only and free of repository secrets", () => {
    expect(ci).toMatch(/^permissions:\s*$/m);
    expect(ci).toMatch(/^\s+contents:\s*read\s*$/m);
    expect(ci).not.toMatch(/\$\{\{\s*secrets\./);
  });
});

describe("release task is recorded", () => {
  it("queues INV-010 for Phase 10 with the roadmap deliverables", () => {
    const task = queue.tasks.find((t) => t.id === "INV-010");
    expect(task).toBeDefined();
    expect(task.phase).toBe("Phase 10 — Release");
    expect(task.dependsOn).toEqual(["INV-009"]);
    const criteria = task.acceptanceCriteria.join(" ").toLowerCase();
    for (const deliverable of ["unit tests", "e2e tests", "lint", "typecheck", "build", "performance", "security", "antislop"]) {
      expect(criteria).toContain(deliverable);
    }
    expect(read(".ai/tasks/INV-010.md")).toContain("# INV-010");
  });
});
