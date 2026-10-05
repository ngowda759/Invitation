# Quality Gates

Every phase must produce evidence.

## Required gates
1. Requirements
2. Architecture
3. Design
4. Functional behavior
5. Tests
6. Typecheck
7. Lint
8. Build
9. Accessibility
10. Performance
11. Security
12. Antislop
13. Final product review

## Merge rule
A PR is mergeable only when all applicable gates pass.

## Failure rule
If a gate fails:
1. Record the failure.
2. OpenHands investigates and fixes.
3. Re-run the failed gate.
4. Re-run dependent gates.
5. Escalate to architecture review after repeated failures.

## Evidence rule
Agents must report commands run, results, and unresolved issues. Never claim a check passed without evidence.

## Visual review rule
Visual changes require screenshots or equivalent browser evidence at:
- 390px mobile
- 768px tablet
- 1440px desktop

## Content rule
Agents must not fabricate temple-specific facts.
