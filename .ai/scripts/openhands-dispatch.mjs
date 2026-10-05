#!/usr/bin/env node
/**
 * Autonomous OpenHands dispatch.
 *
 * Reads the loop state and the pending next-task request, resolves what the worker
 * must do, and starts exactly one OpenHands conversation through the configured
 * Cloud V1 API. Idempotent and safe when the credential is missing.
 *
 * Usage:
 *   node .ai/scripts/openhands-dispatch.mjs            # dispatch the current task
 *   node .ai/scripts/openhands-dispatch.mjs --dry-run  # show the request, send nothing
 *   node .ai/scripts/openhands-dispatch.mjs --json
 *
 * Environment:
 *   OPENHANDS_API_KEY   credential (required to actually dispatch; never printed)
 *   OPENHANDS_HOST      optional API host (defaults to config.openhands.hostDefault)
 */
import { loadConfig } from "./lib/core.mjs";
import { dispatchCurrentTask } from "./lib/openhands.mjs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const asJson = args.includes("--json");
const force = args.includes("--force");

const config = loadConfig();

try {
  const result = await dispatchCurrentTask(config, { dryRun, force });
  if (asJson) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    switch (result.status) {
      case "dispatched":
        console.log(`✓ dispatched ${result.taskId} to OpenHands`);
        console.log(`  conversation: ${result.conversationId ?? "(pending)"}`);
        if (result.startTaskId) console.log(`  start task: ${result.startTaskId}`);
        break;
      case "already-dispatched":
        console.log(`• ${result.taskId} already dispatched (conversation ${result.conversationId ?? "unknown"}); nothing to do`);
        break;
      case "blocked":
        console.error(`✗ dispatch blocked: ${result.reason}`);
        break;
      case "would-dispatch":
        console.log(`DRY RUN: would POST to ${result.endpoint}`);
        console.log(JSON.stringify({ taskId: result.taskId, sourceState: result.sourceState, payload: { ...result.payload, initial_message: "<redacted prompt>" } }, null, 2));
        break;
      case "nothing-to-dispatch":
        console.log(`• nothing to dispatch (status ${result.state})`);
        break;
      default:
        console.log(`• ${result.status}`);
    }
  }
  process.exit(result.status === "blocked" ? 1 : 0);
} catch (error) {
  if (asJson) process.stdout.write(`${JSON.stringify({ status: "error", error: error.message }, null, 2)}\n`);
  else console.error(`✗ ${error.message}`);
  process.exit(1);
}
