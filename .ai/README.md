# Invitation AI Delivery Layer

This directory defines the autonomous delivery contract for the Invitation repository.

## Roles
- ChatGPT: product, architecture, UX, design, acceptance criteria, final quality authority.
- Paperclip: orchestration/state/dependency routing. This repo treats Paperclip as an external orchestrator.
- OpenHands: implementation, tests, debugging and refactoring.
- Antislop: quality gate for code/UI/generated-content anti-patterns.
- GitHub: source of truth and CI.

## Boundary
This project is independent from Rayaramathaynk automation. Do not import or modify the Rayaramathaynk AI loop.

## Rule
No agent may invent temple facts, event dates, timings, religious claims, or source material.
