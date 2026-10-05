#!/usr/bin/env node
/**
 * Post-merge reconciliation entry point.
 *
 * Verifies, from GitHub evidence, that the current task's pull request merged and
 * replays the legal state path to NEXT_PHASE, then requests the next task from the
 * architecture authority. Never fabricates evidence and never skips a state.
 *
 * Usage:
 *   node .ai/scripts/reconcile.mjs [--pr <number>] [--dry-run] [--json]
 *
 * Environment:
 *   GITHUB_TOKEN | GH_TOKEN   credential used for the GitHub API (never printed)
 *   GITHUB_REPOSITORY         "owner/name"; falls back to config.openhands.repos[0]
 */
import { loadConfig } from "./lib/core.mjs";
import { GitHubClient } from "./lib/github.mjs";
import { reconcileMerge } from "./lib/reconcile.mjs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const asJson = args.includes("--json");
const prIndex = args.indexOf("--pr");
const prNumber = prIndex >= 0 ? Number(args[prIndex + 1]) : undefined;

const config = loadConfig();
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
const repo = process.env.GITHUB_REPOSITORY || config.openhands.repos?.[0];

if (!repo) {
  console.error("✗ No repository configured (set GITHUB_REPOSITORY or openhands.repos[0]).");
  process.exit(2);
}

const client = new GitHubClient({ token, repo });

try {
  const result = await reconcileMerge(config, { prNumber, client, dryRun });
  if (asJson) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else if (result.status === "unrelated") {
    console.log(`• PR #${result.prNumber} is not ${result.taskId}'s PR; nothing to reconcile.`);
  } else if (result.status === "nothing-to-do") {
    console.log(`• No merged PR for ${result.taskId} yet; nothing to reconcile.`);
  } else {
    console.log(`✓ reconciliation: ${result.status}`);
    console.log(`  task: ${result.taskId}`);
    if (result.prNumber) console.log(`  PR: #${result.prNumber}`);
    if (result.mergeCommit) console.log(`  merge commit: ${result.mergeCommit}`);
    if (result.path) console.log(`  path: ${result.path.join(" -> ")}`);
    if (result.nextTask) console.log(`  next task: ${JSON.stringify(result.nextTask)}`);
    if (dryRun) console.log("  (dry run — no state was written)");
  }
} catch (error) {
  if (asJson) {
    process.stdout.write(`${JSON.stringify({ status: "refused", error: error.message }, null, 2)}\n`);
  } else {
    console.error(`✗ reconciliation refused: ${error.message}`);
  }
  process.exit(1);
}
