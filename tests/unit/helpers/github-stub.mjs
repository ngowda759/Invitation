/**
 * Test-only GitHub stub.
 *
 * Preloaded with `node --import` so that the real `GitHubClient` (which uses the
 * global `fetch`) talks to a recorded API shape instead of the network. The
 * scenario file path is read from `INVITATION_FAKE_GITHUB`.
 */
import { readFileSync } from "node:fs";

const scenario = JSON.parse(readFileSync(process.env.INVITATION_FAKE_GITHUB, "utf8"));

globalThis.fetch = async (url) => {
  const path = String(url).replace(/^https:\/\/api\.github\.com/, "");
  const ok = (body) => ({ ok: true, status: 200, json: async () => body });

  if (/\/pulls\/\d+$/.test(path)) return ok(scenario.pull);
  if (/\/pulls\?/.test(path)) return ok(scenario.pulls ?? (scenario.pull ? [scenario.pull] : []));
  if (/\/commits\/([0-9a-f]{40})\/check-runs/.test(path)) {
    const sha = /\/commits\/([0-9a-f]{40})\/check-runs/.exec(path)[1];
    const runs = scenario.checkRunsBySha?.[sha] ?? scenario.checkRuns ?? [];
    return ok({ check_runs: runs });
  }
  if (/\/commits\/([0-9a-f]{40})$/.test(path)) {
    const sha = /\/commits\/([0-9a-f]{40})$/.exec(path)[1];
    return ok(scenario.commitsBySha?.[sha] ?? scenario.commit ?? { sha: scenario.pull?.merge_commit_sha ?? sha });
  }
  return { ok: false, status: 404, json: async () => ({ message: "not found" }) };
};
