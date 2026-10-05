#!/usr/bin/env node
/**
 * Inspect or advance the Invitation loop state.
 *
 * Usage:
 *   node .ai/scripts/loop-state.mjs show
 *   node .ai/scripts/loop-state.mjs next
 *   node .ai/scripts/loop-state.mjs set --status READY [--note "..."] [--task INV-001]
 *
 * Advancing never skips a state: an illegal transition is refused with a
 * non-zero exit code and the state file is left unchanged.
 */
import { loadConfig, loadState } from "./lib/core.mjs";
import { allowedNext, transition } from "./lib/loop-state.mjs";

const [, , command, ...rest] = process.argv;
const args = parseFlags(rest);
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

switch (command) {
  case "show": {
    const state = loadState(config);
    console.log(JSON.stringify(state, null, 2));
    break;
  }
  case "next": {
    const state = loadState(config);
    console.log(JSON.stringify({ status: state.status, next: allowedNext(config, state.status) }, null, 2));
    break;
  }
  case "set": {
    if (!args.status) {
      console.error("--status is required");
      process.exit(2);
    }
    const from = loadState(config).status;
    const patch = {};
    if (args.task) patch.currentTaskId = args.task;
    if (args.pr) patch.currentPr = Number(args.pr);
    try {
      const next = transition(config, { to: String(args.status), note: String(args.note ?? ""), patch });
      console.log(`✓ ${from} -> ${next.status}`);
    } catch (error) {
      console.error(`✗ ${error.message}`);
      process.exit(1);
    }
    break;
  }
  default:
    console.error("Usage: loop-state.mjs show | next | set --status <STATE>");
    process.exit(2);
}
