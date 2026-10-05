# Agent Responsibilities

This document defines the responsibilities and boundaries of every agent in the
Invitation delivery system. It refines `docs/AGENT-CONTRACT.md`.

## Architect — product and design authority (governing prompt)

Owns:

- architecture
- product requirements
- design direction
- UX requirements
- acceptance criteria
- final quality authority

The architect prompt (`.ai/prompts/architect.md`) is the **governing specification for
task generation**. Its safety rules are preserved. The configured autonomous worker
(OpenHands) consumes the next-task request automatically, so no human prompt is required
for each task.

## OpenHands — autonomous worker and implementation

Owns:

- generating the next task from the pending request
- implementation
- tests
- fixes
- PR creation

Boundaries:

- Never pushes to `main`.
- Never merges.
- Never weakens CI or quality gates.
- Never implements work outside the approved task scope.

## OpenRouter — automated machine review only

Owns:

- automated machine review of a pull request against the task brief and constitution.

Boundaries:

- It is **not** ChatGPT.
- Its output must never be labelled or represented as a ChatGPT review.
- The review schema requires `isChatGpt: false`.

## AntiSlop — objective quality gate

Owns:

- detecting placeholder content
- detecting forbidden dependencies
- detecting obvious low-quality implementation
- validating scope

Boundaries:

- Uses narrow, targeted rules; it must not reject legitimate code with broad regexes.
- Produces machine-readable output.
- It is objective checks only; it does not silently rewrite product architecture.

## GitHub — source of truth

Owns:

- source of truth for code
- CI
- pull requests
- merge

Boundaries:

- Merge happens only after all applicable required gates pass.

## Anti-misrepresentation rule

No OpenRouter response may be represented as a ChatGPT review. This is enforced
structurally:

- `.ai/schemas/review-report.schema.json` requires `"isChatGpt": false`.
- `.ai/loop.config.json` `review.note` states the reviewer is a machine reviewer.
- `.ai/scripts/validate-loop-config.mjs` fails if the note drops this statement.
