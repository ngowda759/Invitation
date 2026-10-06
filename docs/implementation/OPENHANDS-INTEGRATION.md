# OpenHands Integration

The OpenHands dispatch mechanism is configuration-driven. It does not embed a
credential, an endpoint or a repository name in code.

## Configuration

`.ai/loop.config.json` → `openhands`:

```json
{
  "enabled": true,
  "apiKeyEnvVar": "OPENHANDS_API_KEY",
  "hostEnvVar": "OPENHANDS_HOST",
  "hostDefault": "https://app.all-hands.dev",
  "conversationEndpoint": "/api/v1/app-conversations",
  "startTaskEndpoint": "/api/v1/app-conversations/start-tasks",
  "dispatchRecord": ".ai/state/openhands-dispatch.json",
  "repos": ["ngowda759/Invitation"]
}
```

## API contract

The dispatcher uses the **real OpenHands Cloud V1 app-server API**. It issues
`POST {host}/api/v1/app-conversations` with Bearer auth:

```json
{
  "initial_message": {
    "role": "user",
    "content": [{ "type": "text", "text": "<worker prompt>" }],
    "run": true
  },
  "selected_repository": "ngowda759/Invitation",
  "selected_branch": "main",
  "title": "Invitation INV-002 (READY)"
}
```

The response is a start-task; `app_conversation_id` (or `id`) is recorded as the
conversation id. The prompt is built from the governing prompts (`.ai/prompts/architect.md`,
`.ai/prompts/implementer.md`), the pending next-task request and the task brief.

## Dispatch

```bash
# Dispatch the current loop task. Safe locally: records a blocked state (exit 1)
# when the credential is absent, and never fabricates success.
node .ai/scripts/openhands-dispatch.mjs

# Show the request that would be sent without sending it.
node .ai/scripts/openhands-dispatch.mjs --dry-run

# Machine-readable result.
node .ai/scripts/openhands-dispatch.mjs --json
```

The script:

- reads the credential variable name, host, endpoint and repository from configuration;
- resolves what to dispatch from the loop state: a `READY` task, or the `NEXT_PHASE`
  next-task generation request;
- is idempotent: a task with a `dispatched` record in
  `.ai/state/openhands-dispatch.json` is never dispatched again;
- never prints the credential;
- records `taskId`, `status`, `sourceState`, `conversationId`, `startTaskId`,
  `dispatchedAt` and any `reason`.

The legacy `.ai/scripts/dispatch-openhands.mjs` remains for a single explicit `--task`
dispatch.

## Automatic trigger

`.github/workflows/invitation-autopilot.yml` runs generation and dispatch automatically
when a push to `main` touches `.ai/state/**` or `.ai/tasks/**` (which is what
reconciliation does when it persists the next-task request), and on manual dispatch.
Both steps are idempotent, and a run that changes nothing makes no commit, so the
workflow cannot recurse.

## Secrets and variables

`OPENHANDS_API_KEY` is a **repository secret**. `OPENHANDS_HOST` is a **repository
variable** (`vars.OPENHANDS_HOST`), because the host is not sensitive. The autopilot
workflow reads each from its correct source:

```yaml
env:
  OPENHANDS_API_KEY: ${{ secrets.OPENHANDS_API_KEY }}
  OPENHANDS_HOST: ${{ vars.OPENHANDS_HOST }}
```

Reading the host from `secrets` yields an empty value, and a missing `OPENHANDS_API_KEY`
secret records a `blocked` dispatch — the job then exits non-zero. This is the same
secret-for-the-key / variable-for-the-host mechanism proven in the reference loop; the
validator (`validate-loop-config.mjs`, check 12c) and `tests/unit/automation.test.mjs`
fail if the wiring regresses.

Required:

- `OPENHANDS_API_KEY` (secret)

Optional:

- `OPENHANDS_HOST` (variable; default `https://app.all-hands.dev`)
- `OPENROUTER_API_KEY` (secret; used by the machine reviewer, not by dispatch)
- `OPENROUTER_REVIEW_MODEL` (variable)

Credentials are supplied through GitHub Actions secrets/variables or the orchestration
platform and are never committed.

## Workflow self-modification permission requirement

**Finding (verified 2026-10-05, see `CLEAN-STATE-AUDIT.md` §5):**

A workflow that pushes automation files — in particular files under
`.github/workflows/*` — requires a credential with **repository write** access.

- The default `GITHUB_TOKEN` is read-only when the repository's default workflow
  permission is set to read; it cannot push.
- A GitHub App user-to-server token (`ghu_`) without repository write cannot push.
- A classic PAT with the `repo` (and `workflow`, for workflow files) scope can push.

GitHub additionally requires the **`workflow`** scope (classic PAT) or the
**Workflows** repository permission (fine-grained PAT) to create or update files under
`.github/workflows/`.

**Required permission:**

> A repository secret holding a token with repository **Contents: write** and
> **Workflows: write** (classic PAT scope `repo` + `workflow`), or an equivalent
> GitHub App installation with `contents: write` and `workflows: write`.

**Action taken:** per the rebuild instructions, automation bootstrap **stops here**.
No workflow is created that attempts to push workflow files with a read-only
credential, and repository permissions were **not** weakened to work around this.
The configuration, scripts, schemas and state are committed as ordinary files through
a pull request; enabling self-modifying automation is deferred until a write-capable
credential is provided as a repository secret.
