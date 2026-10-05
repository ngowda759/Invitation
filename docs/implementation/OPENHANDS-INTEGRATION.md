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
  "conversationEndpoint": "/api/conversations",
  "repos": ["ngowda759/Invitation"]
}
```

## Dispatch

```bash
# Safe locally: reports SKIPPED when the credential is absent.
node .ai/scripts/dispatch-openhands.mjs --task INV-001

# Show the request without sending it.
node .ai/scripts/dispatch-openhands.mjs --task INV-001 --dry-run
```

The script:

- reads the credential variable name, host and endpoint from configuration;
- builds the conversation prompt from `.ai/prompts/implementer.md` plus the task brief;
- never prints the credential;
- exits `0` with `SKIPPED` when the credential is not set, so it is safe in CI without secrets.

## Secrets

Required:

- `OPENHANDS_API_KEY`

Optional:

- `OPENHANDS_HOST`
- `OPENROUTER_API_KEY` (used by the machine reviewer, not by dispatch)
- `OPENROUTER_REVIEW_MODEL`

Credentials are supplied through GitHub Actions secrets or the orchestration
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
