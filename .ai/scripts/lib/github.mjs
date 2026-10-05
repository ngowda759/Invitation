/**
 * Minimal, dependency-free GitHub REST client used to obtain *real* merge
 * evidence. Nothing in this module fabricates a PR number, SHA, review result or
 * CI result: every value comes from the GitHub API response.
 *
 * The client is constructed with an injected `fetch` so it can be exercised in
 * tests against a recorded API shape without network access.
 */
const API_BASE = "https://api.github.com";

/** True when the string looks like a 40-hex git object id. */
export function isSha(value) {
  return typeof value === "string" && /^[0-9a-f]{40}$/i.test(value);
}

/** Normalise the raw REST pull request object into the fields the loop needs. */
export function normalisePull(raw) {
  return {
    number: raw.number,
    state: raw.state,
    // The list endpoint reports `state: "closed"` and omits `merged`, but always
    // includes `merged_at` for a merged PR; the single-PR endpoint reports MERGED.
    merged: raw.state === "MERGED" || raw.merged === true || Boolean(raw.merged_at),
    mergedAt: raw.merged_at ?? null,
    mergeCommitSha: raw.merge_commit_sha ?? null,
    headSha: raw.head?.sha ?? null,
    headRef: raw.head?.ref ?? null,
    baseRef: raw.base?.ref ?? null,
    title: raw.title ?? null,
    url: raw.html_url ?? null,
  };
}

export class GitHubClient {
  constructor({ token, repo, fetchImpl = globalThis.fetch, apiBase = API_BASE } = {}) {
    if (!repo || !/^[^/]+\/[^/]+$/.test(repo)) {
      throw new Error(`Invalid repository "${repo}"; expected "owner/name"`);
    }
    this.token = token;
    this.repo = repo;
    this.fetchImpl = fetchImpl;
    this.apiBase = apiBase;
  }

  /** Same contract as the module-level `isSha`, exposed on the instance. */
  isSha(value) {
    return isSha(value);
  }

  async request(path) {
    const url = `${this.apiBase}${path}`;
    const headers = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "invitation-loop",
    };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    const response = await this.fetchImpl(url, { headers });
    if (!response.ok) {
      throw new Error(`GitHub request failed: ${path} -> HTTP ${response.status}`);
    }
    return response.json();
  }

  /** Fetch a pull request by number. */
  async getPull(number) {
    const raw = await this.request(`/repos/${this.repo}/pulls/${number}`);
    return normalisePull(raw);
  }

  /**
   * Find the single merged pull request whose head branch starts with `headPrefix`
   * (e.g. `automation/inv-001`). Returns null when there is no match; throws when
   * more than one matches, so a reconciliation can never silently pick the wrong PR.
   */
  async findMergedPullForTask(taskId, branchPrefix) {
    const prefix = `${branchPrefix}${taskId.toLowerCase()}`;
    const raw = await this.request(`/repos/${this.repo}/pulls?state=closed&per_page=100`);
    const merged = raw
      .map(normalisePull)
      .filter((pr) => pr.merged && pr.headRef && pr.headRef.startsWith(prefix));
    if (merged.length === 0) return null;
    if (merged.length > 1) {
      throw new Error(
        `Multiple merged pull requests found for task ${taskId}: ${merged
          .map((p) => `#${p.number}`)
          .join(", ")}`,
      );
    }
    return merged[0];
  }

  /** Verify a commit exists and return its SHA (plus the committed date). */
  async getCommit(sha) {
    const raw = await this.request(`/repos/${this.repo}/commits/${sha}`);
    return { sha: raw.sha ?? null, committedAt: raw.commit?.committer?.date ?? null };
  }

  /** Check runs for a commit SHA, reduced to the fields used by the merge evidence. */
  async getCheckRuns(sha) {
    const raw = await this.request(`/repos/${this.repo}/commits/${sha}/check-runs?per_page=100`);
    return (raw.check_runs ?? []).map((run) => ({
      name: run.name,
      status: run.status,
      conclusion: run.conclusion,
    }));
  }
}
