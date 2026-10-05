#!/usr/bin/env node
/**
 * Configuration-driven OpenHands dispatch.
 *
 * Reads `.ai/loop.config.json` for the endpoint, credential variable names and
 * repository list. Reads `.ai/prompts/implementer.md` and the task brief to build
 * the conversation prompt.
 *
 * Credentials are never printed and never committed. If `OPENHANDS_API_KEY` is not
 * present, the script reports SKIPPED and exits 0, so it is safe to run locally and
 * in a workflow that has not yet been given secrets.
 *
 * Usage:
 *   node .ai/scripts/dispatch-openhands.mjs [--task INV-001] [--dry-run]
 */
import { existsSync } from "node:fs";

import { fromRepo, loadConfig, readText } from "./lib/core.mjs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const taskArgIndex = args.indexOf("--task");
const config = loadConfig();

const taskId = taskArgIndex >= 0 ? args[taskArgIndex + 1] : config.project.firstTaskId;

if (!taskId || !taskId.startsWith(config.project.taskIdPrefix)) {
  console.error(`✗ --task must be an ${config.project.taskIdPrefix} identifier`);
  process.exit(2);
}

const briefPath = `${config.paths.taskDocs}/${taskId}.md`;
if (!existsSync(fromRepo(briefPath))) {
  console.error(`✗ task brief not found: ${briefPath}`);
  process.exit(2);
}

const apiKey = process.env[config.openhands.apiKeyEnvVar];
const host = process.env[config.openhands.hostEnvVar] || config.openhands.hostDefault;
const endpoint = `${host.replace(/\/$/, "")}${config.openhands.conversationEndpoint}`;

const prompt = [
  readText(".ai/prompts/implementer.md"),
  "",
  "--- TASK BRIEF ---",
  readText(briefPath),
  "",
  "--- DELIVERY ---",
  `Deliver through a pull request against ${config.baseBranch} on branch ${config.branchPrefix}${taskId.toLowerCase()}-foundation.`,
  "Do not push to main. Do not enable auto-merge. Do not start another task.",
].join("\n");

const payload = {
  initial_user_msg: prompt,
  repos: config.openhands.repos,
};

if (!config.openhands.enabled) {
  console.log("SKIPPED: OpenHands dispatch is disabled in .ai/loop.config.json.");
  process.exit(0);
}

if (!apiKey) {
  console.log(
    `SKIPPED: ${config.openhands.apiKeyEnvVar} is not set. ` +
      "Configure the repository secret to enable dispatch.",
  );
  process.exit(0);
}

if (dryRun) {
  console.log(`DRY RUN: would POST to ${endpoint}`);
  console.log(JSON.stringify({ ...payload, initial_user_msg: "<redacted prompt>" }, null, 2));
  process.exit(0);
}

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

const bodyText = await response.text();

if (!response.ok) {
  console.error(`✗ OpenHands dispatch failed: HTTP ${response.status}`);
  console.error(bodyText.slice(0, 2000));
  process.exit(1);
}

let summary;
try {
  const parsed = JSON.parse(bodyText);
  summary = { id: parsed.id ?? parsed.conversation_id ?? null, status: parsed.status ?? null };
} catch {
  summary = { raw: bodyText.slice(0, 500) };
}

console.log(`✓ dispatched ${taskId} to OpenHands`);
console.log(JSON.stringify(summary, null, 2));
