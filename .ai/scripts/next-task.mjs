#!/usr/bin/env node
/**
 * Next-task generation entry point.
 *
 * The architecture authority is the configured autonomous worker (OpenHands). The
 * architect prompt is the governing specification. The loop requests the next task
 * after a merge and the worker consumes that request automatically: `generate`
 * produces and applies the brief through the state machine, so no human prompt is
 * required for each task.
 *
 * Usage:
 *   node .ai/scripts/next-task.mjs request [--json]      # show the pending request
 *   node .ai/scripts/next-task.mjs status  [--json]      # show the next-task state
 *   node .ai/scripts/next-task.mjs generate [--dry-run] [--json]
 *   node .ai/scripts/next-task.mjs apply --file <json> [--brief <md>] [--json]
 */
import { readFileSync } from "node:fs";

import { loadConfig, loadQueue, loadState, fromRepo } from "./lib/core.mjs";
import { readRequest } from "./lib/architect.mjs";
import { applyBrief, nextTaskId, readRoadmap } from "./lib/next-task.mjs";
import { generateNextTask } from "./lib/generate.mjs";

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
  case "generate": {
    let blocked = false;
    try {
      const result = generateNextTask(config, { dryRun: args["dry-run"] === true });
      if (asJson) print(result);
      else if (result.status === "generated") console.log(`✓ generated ${result.taskId} (phase ${result.phase})`);
      else if (result.status === "already-generated") console.log(`• ${result.taskId} already exists; nothing to generate`);
      else if (result.status === "blocked") console.error(`✗ blocked: ${result.reason}`);
      else if (result.status === "would-generate") console.log(`DRY RUN: would generate ${result.taskId} (phase ${result.phase})`);
      else console.log(`• nothing to generate (${result.status})`);
      blocked = result.status === "blocked";
    } catch (error) {
      console.error(`✗ ${error.message}`);
      process.exit(1);
    }
    // A BLOCKED generation is a signal for human attention, so it exits non-zero.
    if (blocked) process.exit(1);
    break;
  }
  default:
    console.error("Usage: next-task.mjs request | status | apply --file <json> [--brief <md>]");
    process.exit(2);
}
