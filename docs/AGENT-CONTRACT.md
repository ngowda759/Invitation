# Agent Contract

## Universal rules
- Read the project constitution before modifying code.
- Follow the current phase only.
- Do not broaden scope without an explicit task.
- Do not rewrite working architecture without justification.
- Do not invent content.
- Do not hide test failures.
- Do not weaken quality gates to obtain a pass.
- Keep changes focused and reversible.
- Document architectural decisions.

## Handoff contract
Every agent handoff must contain:
- phase
- objective
- files changed
- tests/checks run
- failures
- remaining work
- recommendation for next agent

## Git contract
- One logical change per PR.
- Use descriptive branch names.
- No direct implementation commits to main unless explicitly authorized by orchestration.
- PR description must include acceptance criteria and validation evidence.

## Escalation
Stop and request architecture review if:
- requirements conflict
- a change requires breaking an established contract
- a security issue cannot be safely resolved
- repeated fixes produce regressions
- the visual direction cannot be met without major architecture change
