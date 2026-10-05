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
  if (/\/commits\/[0-9a-f]{40}\/check-runs/.test(path)) {
    return ok({ check_runs: scenario.checkRuns ?? [] });
  }
  if (/\/commits\/[0-9a-f]{40}$/.test(path)) {
    return ok(scenario.commit ?? { sha: scenario.pull?.merge_commit_sha });
  }
  return { ok: false, status: 404, json: async () => ({ message: "not found" }) };
};
