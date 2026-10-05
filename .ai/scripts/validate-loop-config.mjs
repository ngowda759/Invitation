#!/usr/bin/env node
/**
 * Validate the Invitation automation configuration, state, queue, schemas and
 * workflows together. Exits non-zero on any problem.
 *
 * Usage: node .ai/scripts/validate-loop-config.mjs [--json]
 */
import { existsSync } from "node:fs";

import { fromRepo, loadConfig, loadQueue, loadState, readJson, readText } from "./lib/core.mjs";
import { validate } from "./lib/schema.mjs";

const asJson = process.argv.includes("--json");
const problems = [];
const notes = [];

function fail(message) {
  problems.push(message);
}

// 1. Config against its schema.
const config = loadConfig();
const configSchema = readJson(".ai/schemas/loop-config.schema.json");
for (const e of validate(configSchema, config)) fail(`loop.config.json ${e}`);

// 2. Schema/state-machine agreement: the state enum must match everywhere.
const stateSchema = readJson(".ai/schemas/loop-state.schema.json");
const queueSchema = readJson(".ai/schemas/task-queue.schema.json");
const stateEnum = stateSchema.properties.status.enum;
const queueEnum = queueSchema.properties.tasks.items.properties.status.enum;
const machineStates = config.stateMachine.states;

for (const [label, list] of [
  ["loop-state.schema.json", stateEnum],
  ["task-queue.schema.json", queueEnum],
]) {
  const same =
    list.length === machineStates.length && machineStates.every((s) => list.includes(s));
  if (!same) fail(`${label} status enum does not match config.stateMachine.states`);
}

// 3. Every state must be a key in transitions, and every transition target known.
for (const state of machineStates) {
  if (!(state in config.stateMachine.transitions)) {
    fail(`state "${state}" has no entry in stateMachine.transitions`);
  }
}
for (const [from, targets] of Object.entries(config.stateMachine.transitions)) {
  if (!machineStates.includes(from)) fail(`transition key "${from}" is not a declared state`);
  for (const to of targets) {
    if (!machineStates.includes(to)) fail(`transition ${from} -> ${to} targets an unknown state`);
  }
}
if (!(config.stateMachine.transitions.FIX_REQUIRED ?? []).includes("REVALIDATING")) {
  fail("state machine must route FIX_REQUIRED -> REVALIDATING");
}

// 4. State against its schema and against the config.
const state = loadState(config);
for (const e of validate(stateSchema, state)) fail(`loop-state.json ${e}`);
if (state.maxReviewRounds !== config.limits.maxReviewRounds) {
  fail("loop-state.json maxReviewRounds does not match config.limits.maxReviewRounds");
}
if (state.currentTaskId && !state.currentTaskId.startsWith(config.project.taskIdPrefix)) {
  fail(`currentTaskId "${state.currentTaskId}" does not use prefix ${config.project.taskIdPrefix}`);
}

// 5. Every recorded history transition must be legal.
for (const [i, entry] of state.history.entries()) {
  if (entry.from === null) continue;
  const allowed = config.stateMachine.transitions[entry.from] ?? [];
  if (entry.from !== entry.to && !allowed.includes(entry.to)) {
    fail(`history[${i}] illegal transition ${entry.from} -> ${entry.to}`);
  }
}

// 6. Queue against its schema.
const queue = loadQueue(config);
for (const e of validate(queueSchema, queue)) fail(`task-queue.json ${e}`);

const ids = queue.tasks.map((t) => t.id);
if (new Set(ids).size !== ids.length) fail("task-queue.json contains duplicate task ids");
for (const task of queue.tasks) {
  if (!task.id.startsWith(config.project.taskIdPrefix)) {
    fail(`task "${task.id}" does not use prefix ${config.project.taskIdPrefix}`);
  }
  for (const dep of task.dependsOn) {
    if (!ids.includes(dep)) fail(`task "${task.id}" depends on unknown task "${dep}"`);
    if (dep === task.id) fail(`task "${task.id}" depends on itself`);
  }
  const doc = `${config.paths.taskDocs}/${task.id}.md`;
  if (!existsSync(fromRepo(doc))) fail(`task "${task.id}" has no task document at ${doc}`);
}

// 6b. Queue/state consistency: the queue must agree with the loop state.
const currentTask = queue.tasks.find((t) => t.id === state.currentTaskId);
if (!currentTask) {
  fail(`currentTaskId "${state.currentTaskId}" is not present in the task queue`);
} else if (currentTask.status !== state.status) {
  fail(
    `queue status "${currentTask.status}" for ${currentTask.id} does not match loop-state status "${state.status}"`,
  );
}
for (const id of state.completedTasks) {
  const done = queue.tasks.find((t) => t.id === id);
  if (!done) fail(`completed task "${id}" is not present in the task queue`);
  else if (!["MERGED", "NEXT_PHASE"].includes(done.status)) {
    fail(`completed task "${id}" must be recorded as MERGED or NEXT_PHASE, found "${done.status}"`);
  }
}
if (state.lastMerge && !state.completedTasks.includes(state.lastMerge.taskId)) {
  fail("loop-state.lastMerge.taskId must be a completed task");
}
if (state.nextTask?.status === "applied" && state.nextTask.taskId && !ids.includes(state.nextTask.taskId)) {
  fail(`loop-state.nextTask.taskId "${state.nextTask.taskId}" is not present in the task queue`);
}
if (state.nextTask?.status === "requested" && !existsSync(fromRepo(config.architect.request))) {
  fail("loop-state.nextTask is 'requested' but no architect request file exists");
}

// 7. Paths must exist.
for (const [key, p] of Object.entries(config.paths)) {
  if (key === "taskDocs") continue;
  if (!existsSync(fromRepo(p))) fail(`config.paths.${key} points to a missing file: ${p}`);
}

// 8. CI contract.
const ciText = readText(config.ci.workflowFile);
for (const step of config.ci.requiredSteps) {
  if (!ciText.includes(step)) fail(`CI workflow is missing required step: ${step}`);
}
if (!/^permissions:\s*$/m.test(ciText) || !/^\s+contents:\s*read\s*$/m.test(ciText)) {
  fail("CI workflow must declare permissions: contents: read");
}

// 9. AntiSlop gate must exist and be blocking.
if (!existsSync(fromRepo(config.antislop.workflowFile))) {
  fail(`AntiSlop workflow missing: ${config.antislop.workflowFile}`);
}
if (config.antislop.blocking !== true) fail("AntiSlop gate must be blocking");
if (!existsSync(fromRepo(config.antislop.script))) {
  fail(`AntiSlop script missing: ${config.antislop.script}`);
}

// 10. Review provider must be honest about not being ChatGPT.
if (config.review.provider !== "openrouter") fail("review provider must be openrouter");
if (!/not.{0,40}ChatGPT|never.{0,40}ChatGPT|machine reviewer/i.test(config.review.note ?? "")) {
  fail("review.note must state the reviewer is a machine reviewer and not ChatGPT");
}

// 11. The architect authority must be ChatGPT and honest about not being automated.
if (config.architect.provider !== "chatgpt") fail("architect provider must be chatgpt");
if (!existsSync(fromRepo(config.architect.prompt))) {
  fail(`architect prompt missing: ${config.architect.prompt}`);
}
if (!/human-directed|not an automated endpoint/i.test(config.architect.note ?? "")) {
  fail("architect.note must state that ChatGPT is a human-directed authority, not an automated endpoint");
}

// 12. Post-merge reconciliation must be wired: scripts present and a workflow triggers after merge.
for (const script of [".ai/scripts/reconcile.mjs", ".ai/scripts/next-task.mjs"]) {
  if (!existsSync(fromRepo(script))) fail(`reconciliation script missing: ${script}`);
}
const reconcileWorkflow = ".github/workflows/invitation-reconcile.yml";
if (!existsSync(fromRepo(reconcileWorkflow))) {
  fail(`post-merge reconciliation workflow missing: ${reconcileWorkflow}`);
} else {
  const wf = readText(reconcileWorkflow);
  if (!/pull_request/.test(wf) || !/closed/.test(wf)) {
    fail("reconciliation workflow must trigger on pull_request closed");
  }
  if (!/reconcile\.mjs/.test(wf)) fail("reconciliation workflow must invoke .ai/scripts/reconcile.mjs");
}

notes.push(`states: ${machineStates.length}`);
notes.push(`tasks: ${queue.tasks.length} (${ids.join(", ")})`);
notes.push(`current status: ${state.status}`);

if (asJson) {
  process.stdout.write(
    `${JSON.stringify({ ok: problems.length === 0, problems, notes }, null, 2)}\n`,
  );
} else {
  for (const n of notes) console.log(`• ${n}`);
  for (const p of problems) console.error(`✗ ${p}`);
  console.log(
    problems.length === 0
      ? "✓ loop configuration, state, queue and workflows are consistent"
      : `✗ ${problems.length} problem(s) found`,
  );
}

process.exit(problems.length === 0 ? 0 : 1);
