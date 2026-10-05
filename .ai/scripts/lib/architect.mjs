/**
 * Next-task generation request mechanism.
 *
 * The architecture authority is the configured autonomous worker
 * (`architect.provider === "openhands"`). The architect prompt is the governing
 * specification for task generation; the worker consumes the request automatically, so
 * no human prompt is required for each task.
 *
 * Nothing here invents a task: when no request is pending the caller records a
 * waiting/failed state and never fabricates a task id or content.
 */
import { existsSync } from "node:fs";

import { fromRepo, loadConfig, loadQueue, readJson, writeJsonAtomic } from "./core.mjs";

/** Read the currently pending next-task request, or null when none is pending. */
export function readRequest(config) {
  const path = config.architect.request;
  if (!existsSync(fromRepo(path))) return null;
  return readJson(path);
}

/**
 * Write (or overwrite) the pending next-task request. Deterministic for the same
 * merged task, so a repeated reconciliation produces byte-identical content.
 */
export function writeRequest(config, request) {
  writeJsonAtomic(config.architect.request, request);
  return request;
}

/**
 * Build the request from the reconciled state and queue. The suggested id and the
 * phase come from the loop's own bookkeeping (next sequence number, the roadmap
 * phase that follows the completed one) rather than from anything invented here.
 */
export function buildRequest(config, { completedTaskId, merge, phase, suggestedId, dependsOn }) {
  const prompt = existsSync(fromRepo(config.architect.prompt))
    ? config.architect.prompt
    : null;
  return {
    version: 1,
    requestedAt: new Date().toISOString(),
    requestedBy: "invitation-loop",
    authority: {
      provider: config.architect.provider,
      prompt,
      note: config.architect.note,
    },
    afterTaskId: completedTaskId,
    merge: merge ?? null,
    phase,
    suggestedId,
    dependsOn,
    instructions: [
      "Produce exactly one task brief for the next phase in docs/PHASES.md.",
      "Output a JSON task object satisfying .ai/schemas/task-queue.schema.json.",
      `Provide the Markdown brief at .ai/tasks/${suggestedId}.md.`,
      "Apply it with: node .ai/scripts/next-task.mjs apply --file <json> [--brief <md>]",
      "Do not invent temple facts, dates, timings, historical or religious claims.",
    ],
  };
}

/** Report whether a queue task id is already present (used for duplicate refusal). */
export function queueHasTask(config, taskId) {
  const queue = loadQueue(config);
  return queue.tasks.some((task) => task.id === taskId);
}

export { loadConfig };
