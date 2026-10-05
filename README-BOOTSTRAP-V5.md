# Invitation Bootstrap v4 — Clean Baseline

This package bootstraps the Invitation autonomous development loop without creating the application itself.

## What it does

1. Imports the proven automation engine from `ngowda759/Badminton`.
2. Adapts the imported engine to Invitation.
3. Creates `.ai/loop.config.json`, state, task queue and review log.
4. Creates the `INV-001` foundation task.
5. Creates the Invitation AntiSlop quality gate.
6. Validates generated JSON and workflow configuration.
7. Commits only the automation bootstrap files to `main`.

## What it deliberately does not do

- Does not overwrite `.github/workflows/ci.yml`.
- Does not create Next.js application code.
- Does not add a database, auth, backend, Raya AI or Rayaramathaynk runtime dependency.
- Does not modify the Rayaramathaynk repository.
- Does not run the implementation task during bootstrap.

## Before running

1. Remove/disable any older Invitation bootstrap workflow (especially v2/v3).
2. Upload `.github/workflows/bootstrap-invitation-loop-v4.yml` to the Invitation repository.
3. Commit it to `main`.
4. Run **Bootstrap Invitation AI Loop v4** manually from GitHub Actions.

After the bootstrap succeeds, inspect the generated automation files and only then configure:

- `OPENHANDS_API_KEY`
- `OPENROUTER_API_KEY`
- optional `OPENHANDS_HOST`
- optional `OPENROUTER_REVIEW_MODEL`

`INV-001` is the first implementation task. It is intentionally not executed by the bootstrap workflow itself.
