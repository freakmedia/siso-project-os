# {{PROJECT_NAME}} — Agent Router

<!-- siso-project-os:v1 -->

This repository uses SISO Project OS for project-local agent state.

## Start here

1. `PROJECT-OS.md` — where each kind of project truth lives.
2. `.agents/tasks/` — canonical work registry.
3. `docs/project-os/README.md` — knowledge-spine rules.
4. `.uihub/README.md` — task-linked UI campaign workflow.

## Binding rules

- A plan is not committed work until it has one canonical task ID.
- Dashboards, indexes, and HTML views are projections, never alternate writers.
- Every run packet names its parent task, write fence, return shape, verification, and stop condition.
- Checks are read-only. Repairs and archive/fold operations are explicit.
- Durable lessons go to `.agents/memory/`; attempt-specific material stays with its run or task evidence.
- UI campaigns reference canonical task IDs and cannot own an independent backlog.
- Preserve unrelated dirty work and verify completion from repository evidence, not an agent claim.

Run `npx github:sisodias/siso-project-os check .` before handoff.
