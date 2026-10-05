/**
 * OpenHands dispatch.
 *
 * Starts one OpenHands conversation for the task the loop is currently at, using
 * the real OpenHands Cloud V1 app-server contract
 * (`POST /api/v1/app-conversations`). The endpoint, credential variable and
 * repository are read from configuration; nothing is hard-coded.
 *
 * Guarantees:
 *   - Idempotent: a task that already has a recorded dispatch is never dispatched
 *     again. The record lives in `.ai/state/openhands-dispatch.json`.
 *   - Fails safely: a missing credential records a blocked dispatch and never
 *     fabricates a successful dispatch.
 *   - Observable: the conversation/start-task id is recorded.
 */
import { existsSync } from "node:fs";

import { fromRepo, loadConfig, loadQueue, loadState, readJson, readText, writeJsonAtomic } from "./core.mjs";
import { readRequest } from "./architect.mjs";

export const DISPATCH_VERSION = 1;

/** Read the persisted dispatch record, or null when none exists. */
export function readDispatchRecord(config) {
  const path = config.openhands.dispatchRecord;
  if (!existsSync(fromRepo(path))) return null;
  return readJson(path);
}

/** A dispatch is only reusable when it belongs to the same task and succeeded. */
export function isDispatched(config, taskId) {
  const record = readDispatchRecord(config);
  return Boolean(record && record.taskId === taskId && record.status === "dispatched");
}

function recordDispatch(config, record) {
  writeJsonAtomic(config.openhands.dispatchRecord, { version: DISPATCH_VERSION, updatedAt: new Date().toISOString(), ...record });
  return record;
}

/**
 * Determine what the loop is asking the worker to do, from the persisted state.
 * Returns null when there is nothing to dispatch.
 */
export function resolveDispatchTarget(config, state = loadState(config)) {
  const request = readRequest(config);

  if (state.status === "NEXT_PHASE" && state.nextTask?.status === "requested" && request) {
    return {
      mode: "next-phase",
      taskId: state.nextTask.taskId ?? request.suggestedId,
      sourceState: "NEXT_PHASE",
      request,
      phase: request.phase,
    };
  }
  if (state.status === "READY" && state.currentTaskId) {
    return { mode: "ready", taskId: state.currentTaskId, sourceState: "READY", request, phase: null };
  }
  return null;
}

/** Build the deterministic worker prompt from the governing prompts and state. */
export function buildWorkerPrompt(config, target) {
  const parts = [readText(config.architect.prompt)];
  const queue = loadQueue(config);
  const task = queue.tasks.find((t) => t.id === target.taskId);

  if (target.mode === "next-phase") {
    parts.push(
      "",
      "--- NEXT-TASK REQUEST ---",
      JSON.stringify(target.request, null, 2),
      "",
      "--- AUTONOMOUS GENERATION ---",
      `Generate the next task (${target.taskId}) from the request and docs/PHASES.md:`,
      "1. inspect .ai/state/next-task-request.json, .ai/prompts/architect.md, docs/PHASES.md and docs/",
      "2. produce exactly one JSON task object satisfying .ai/schemas/task-queue.schema.json",
      `3. write the Markdown brief to .ai/tasks/${target.taskId}.md`,
      `4. run: node .ai/scripts/next-task.mjs generate`,
      "5. validate with: node .ai/scripts/validate-loop-config.mjs",
      "Do not invent temple facts, dates, timings, historical or religious claims. If the brief cannot",
      "be derived safely from repository evidence, record a BLOCKED state instead of inventing requirements.",
    );
  } else {
    parts.push("", "--- TASK BRIEF ---", readText(`${config.paths.taskDocs}/${target.taskId}.md`));
  }

  parts.push(
    "",
    "--- IMPLEMENTATION ---",
    readText(".ai/prompts/implementer.md"),
    "",
    "--- DELIVERY ---",
    `Implement ${target.taskId} and deliver it through a pull request against ${config.baseBranch}.`,
    "Run npm ci, npm run lint, npm run typecheck, npm test and npm run build.",
    "Do not push to main. Do not merge. Do not start another task.",
    task ? `Task phase: ${task.phase}.` : "",
  );
  return parts.filter(Boolean).join("\n");
}

/** Normalise the OpenHands start response into the fields the record keeps. */
export function normaliseStart(raw) {
  return {
    startTaskId: raw?.id ?? null,
    conversationId: raw?.app_conversation_id ?? raw?.id ?? null,
    apiStatus: raw?.status ?? null,
  };
}

/**
 * Dispatch the current loop task to OpenHands.
 *
 * @returns {Promise<object>} a result describing what happened.
 */
export async function dispatchCurrentTask(
  config,
  { fetchImpl = globalThis.fetch, now = () => new Date().toISOString(), dryRun = false, force = false } = {},
) {
  if (!config.openhands.enabled) return { status: "disabled" };

  const state = loadState(config);
  const target = resolveDispatchTarget(config, state);
  if (!target) return { status: "nothing-to-dispatch", state: state.status };

  if (!force && isDispatched(config, target.taskId)) {
    const record = readDispatchRecord(config);
    return { status: "already-dispatched", taskId: target.taskId, conversationId: record.conversationId };
  }

  const apiKey = process.env[config.openhands.apiKeyEnvVar];
  const host = (process.env[config.openhands.hostEnvVar] || config.openhands.hostDefault).replace(/\/$/, "");
  const endpoint = `${host}${config.openhands.conversationEndpoint}`;

  if (!apiKey) {
    const reason = `${config.openhands.apiKeyEnvVar} is not set; refusing to fabricate a dispatch.`;
    if (!dryRun) {
      recordDispatch(config, { taskId: target.taskId, status: "blocked", sourceState: target.sourceState, conversationId: null, startTaskId: null, dispatchedAt: null, reason });
    }
    return { status: "blocked", taskId: target.taskId, reason };
  }

  const prompt = buildWorkerPrompt(config, target);
  const payload = {
    initial_message: {
      role: "user",
      content: [{ type: "text", text: prompt }],
      run: true,
    },
    selected_repository: config.openhands.repos?.[0],
    selected_branch: config.baseBranch,
    title: `Invitation ${target.taskId} (${target.sourceState})`,
  };

  if (dryRun) {
    return { status: "would-dispatch", taskId: target.taskId, sourceState: target.sourceState, endpoint, payload };
  }

  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const bodyText = await response.text();
  if (!response.ok) {
    const reason = `OpenHands dispatch failed: HTTP ${response.status}`;
    recordDispatch(config, { taskId: target.taskId, status: "blocked", sourceState: target.sourceState, conversationId: null, startTaskId: null, dispatchedAt: null, reason });
    return { status: "blocked", taskId: target.taskId, reason, detail: bodyText.slice(0, 500) };
  }

  let raw;
  try {
    raw = JSON.parse(bodyText);
  } catch {
    raw = {};
  }
  const normalised = normaliseStart(raw);

  const record = recordDispatch(config, {
    taskId: target.taskId,
    status: "dispatched",
    sourceState: target.sourceState,
    conversationId: normalised.conversationId,
    startTaskId: normalised.startTaskId,
    dispatchedAt: now(),
    reason: null,
  });

  return { status: "dispatched", taskId: target.taskId, sourceState: target.sourceState, ...normalised, record };
}

export { loadConfig };
