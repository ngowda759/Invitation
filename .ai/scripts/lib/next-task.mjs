/**
 * Next-task generation: task-id sequencing, roadmap phase resolution, brief
 * validation and application to the queue.
 *
 * Application is the final step of next-task generation. It is separate from
 * reconciliation on purpose: reconciliation records a *verified merge*; this module
 * records the *architecture authority's* decision about what comes next.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

import {
  fromRepo,
  loadConfig,
  loadQueue,
  loadState,
  readJson,
  readText,
  writeJsonAtomic,
} from "./core.mjs";
import { transition } from "./loop-state.mjs";
import { validate } from "./schema.mjs";

/** Parse `docs/PHASES.md` into an ordered roadmap of { number, name, label }. */
export function readRoadmap() {
  const text = readText("docs/PHASES.md");
  const phases = [];
  for (const match of text.matchAll(/^##\s+Phase\s+(\d+)\s*[—–-]\s*(.+?)\s*$/gm)) {
    phases.push({ number: Number(match[1]), name: match[2], label: `Phase ${match[1]} — ${match[2]}` });
  }
  return phases.sort((a, b) => a.number - b.number);
}

/**
 * The phase that follows the completed task's phase according to the roadmap.
 * Returns null when the roadmap does not define a following phase, so the caller
 * must obtain the phase explicitly from the authority rather than guess it.
 */
export function phaseAfter(config, completedPhaseLabel) {
  const roadmap = readRoadmap();
  const numberMatch = /(?:Phase\s+|P)(\d+)/i.exec(completedPhaseLabel ?? "");
  if (!numberMatch) return null;
  const next = roadmap.find((p) => p.number === Number(numberMatch[1]) + 1);
  return next ? next.label : null;
}

/** Next sequential task id from the queue, e.g. INV-002 after INV-001. */
export function nextTaskId(config, queue) {
  const prefix = config.project.taskIdPrefix;
  const numbers = queue.tasks
    .map((t) => (t.id.startsWith(prefix) ? Number(t.id.slice(prefix.length)) : NaN))
    .filter((n) => Number.isInteger(n));
  const max = numbers.length ? Math.max(...numbers) : 0;
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

/** Validate a candidate task object against the task-queue item schema. */
export function validateBrief(config, task) {
  const queueSchema = readJson(".ai/schemas/task-queue.schema.json");
  const itemSchema = queueSchema.properties.tasks.items;
  const errors = validate(itemSchema, task);
  const ids = loadQueue(config).tasks.map((t) => t.id);
  for (const dep of task.dependsOn ?? []) {
    if (!ids.includes(dep) && dep !== task.id) {
      errors.push(`dependsOn references unknown task "${dep}"`);
    }
  }
  return errors;
}

/**
 * Apply a task brief returned by the architecture authority.
 *
 * Refuses duplicates, validates the schema, writes the brief document and moves
 * the loop from NEXT_PHASE to READY with the new task as the current task.
 * Idempotent: applying the same id twice is a no-op once it is the current task.
 */
export function applyBrief(config, { task, briefMarkdown, briefPath }) {
  const queue = loadQueue(config);
  const state = loadState(config);
  const prefix = config.project.taskIdPrefix;

  if (!task || typeof task !== "object") throw new Error("Task brief must be a JSON object.");
  if (typeof task.id !== "string" || !task.id.startsWith(prefix)) {
    throw new Error(`Task id must start with ${prefix}`);
  }

  if (queue.tasks.some((t) => t.id === task.id)) {
    if (state.currentTaskId === task.id && state.status === "READY") {
      return { applied: false, reason: "already applied", taskId: task.id };
    }
    throw new Error(`Task ${task.id} already exists in the queue; refusing to duplicate it.`);
  }

  // The generated task must belong to the next phase in the approved roadmap. The
  // expectation comes from the roadmap, not from anything invented here.
  const currentTask = queue.tasks.find((t) => t.id === state.currentTaskId);
  const expectedPhase = phaseAfter(config, currentTask?.phase);
  if (expectedPhase && task.phase !== expectedPhase) {
    throw new Error(
      `Generated task phase "${task.phase}" is not the next roadmap phase "${expectedPhase}".`,
    );
  }

  const errors = validateBrief(config, task);
  if (errors.length) {
    throw new Error(`Task brief is invalid:\n  - ${errors.join("\n  - ")}`);
  }

  const docPath = `${config.paths.taskDocs}/${task.id}.md`;
  let markdown = briefMarkdown;
  if (!markdown && briefPath) markdown = readFileSync(fromRepo(briefPath), "utf8");
  if (!markdown && existsSync(fromRepo(docPath))) markdown = readFileSync(fromRepo(docPath), "utf8");
  if (!markdown) {
    throw new Error(
      `No brief document supplied for ${task.id}. Provide --brief <md> or commit ${docPath}.`,
    );
  }

  const at = new Date().toISOString();
  writeFileSync(fromRepo(docPath), markdown);

  const nextQueue = {
    ...queue,
    updatedAt: at,
    tasks: [...queue.tasks, { ...task, status: "READY" }],
  };
  writeJsonAtomic(config.paths.queue, nextQueue);

  transition(config, {
    to: "READY",
    note: `Next task ${task.id} ("${task.title}") applied from the ${config.architect.provider} authority for phase ${task.phase}.`,
    patch: {
      currentTaskId: task.id,
      currentPr: null,
      reviewedHeadSha: null,
      lastVerdict: null,
      lastCiStatus: null,
      blockedReason: null,
      round: 0,
      nextTask: {
        status: "applied",
        taskId: task.id,
        requestedAt: state.nextTask?.requestedAt ?? null,
        reason: null,
      },
    },
  });

  return { applied: true, taskId: task.id, phase: task.phase };
}

export { loadConfig };
