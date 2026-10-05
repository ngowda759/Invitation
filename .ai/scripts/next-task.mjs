#!/usr/bin/env node
/**
 * Next-task generation entry point.
 *
 * The architecture/product authority is ChatGPT, a human-directed authority. The
 * loop requests the next task from it and waits for the brief to be applied; this
 * CLI is how that brief is validated and applied, and how the pending request is
 * inspected.
 *
 * Usage:
 *   node .ai/scripts/next-task.mjs request [--json]      # show the pending request
 *   node .ai/scripts/next-task.mjs status  [--json]      # show the next-task state
 *   node .ai/scripts/next-task.mjs apply --file <json> [--brief <md>] [--json]
 */
import { readFileSync } from "node:fs";

import { loadConfig, loadQueue, loadState, fromRepo } from "./lib/core.mjs";
import { readRequest } from "./lib/architect.mjs";
import { applyBrief, nextTaskId, readRoadmap } from "./lib/next-task.mjs";

const [, , command, ...rest] = process.argv;
const args = parseFlags(rest);
const asJson = args.json === true;
const config = loadConfig();

function parseFlags(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
      out[key] = value;
    }
  }
  return out;
}

function print(value) {
  if (asJson) process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
  else console.log(typeof value === "string" ? value : JSON.stringify(value, null, 2));
}

switch (command) {
  case "request": {
    const request = readRequest(config);
    if (!request) {
      print({ status: "none", reason: "No pending next-task request." });
      break;
    }
    print(request);
    break;
  }
  case "status": {
    const state = loadState(config);
    const queue = loadQueue(config);
    const roadmap = readRoadmap(config);
    print({
      status: state.status,
      nextTask: state.nextTask ?? null,
      suggestedId: nextTaskId(config, queue),
      tasks: queue.tasks.map((t) => ({ id: t.id, status: t.status, phase: t.phase })),
      roadmap: roadmap.map((p) => p.label),
    });
    break;
  }
  case "apply": {
    if (!args.file) {
      console.error("✗ --file <json> is required");
      process.exit(2);
    }
    const task = JSON.parse(readFileSync(fromRepo(String(args.file)), "utf8"));
    const briefMarkdown = args.brief ? readFileSync(fromRepo(String(args.brief)), "utf8") : undefined;
    try {
      const result = applyBrief(config, { task, briefMarkdown, briefPath: args.brief ? String(args.brief) : undefined });
      if (asJson) print(result);
      else if (result.applied) console.log(`✓ applied ${result.taskId} (phase ${result.phase})`);
      else console.log(`• ${result.taskId} already applied; nothing to do`);
    } catch (error) {
      console.error(`✗ ${error.message}`);
      process.exit(1);
    }
    break;
  }
  default:
    console.error("Usage: next-task.mjs request | status | apply --file <json> [--brief <md>]");
    process.exit(2);
}
