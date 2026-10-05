/**
 * Test-only OpenHands API stub.
 *
 * Preloaded with `node --import` so the real dispatcher (which uses the global
 * `fetch`) talks to a recorded OpenHands Cloud start-task response instead of the
 * network. The scenario file path is read from `INVITATION_FAKE_OPENHANDS`.
 */
import { readFileSync, appendFileSync } from "node:fs";

const scenario = JSON.parse(readFileSync(process.env.INVITATION_FAKE_OPENHANDS, "utf8"));

globalThis.fetch = async (url, init = {}) => {
  const path = String(url).replace(/^https:\/\/[^/]+/, "");
  const method = init.method ?? "GET";

  if (method === "POST" && /\/api\/v1\/app-conversations$/.test(path)) {
    if (process.env.INVITATION_OPENHANDS_COUNT) {
      appendFileSync(process.env.INVITATION_OPENHANDS_COUNT, "POST\n");
    }
    if (scenario.fail) {
      return {
        ok: false,
        status: scenario.failStatus ?? 500,
        text: async () => JSON.stringify({ detail: scenario.fail }),
      };
    }
    return { ok: true, status: 201, text: async () => JSON.stringify(scenario.start ?? {}) };
  }
  return { ok: false, status: 404, text: async () => JSON.stringify({ message: "not found" }) };
};
