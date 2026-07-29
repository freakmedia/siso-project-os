# Agent work system — {{PROJECT_NAME}}

This directory stores project-local operating records for agents and humans. It is not a
second application framework and it must not duplicate product documentation.

## Start here

- `tasks/` — canonical work-item registry.
- `sprints/` — time-bounded coordination over existing task IDs.
- `runs/` — immutable execution attempts, packets, receipts, and closeouts.
- `briefs/CURRENT.md` — the one live resume pointer.
- `memory/` — one durable project fact per Markdown file.

Machine-readable records are canonical. Indexes, boards, and dashboards are projections and
must never become alternate writers. Use the `project-os` commands for mutations so IDs,
references, lifecycle moves, and projections stay consistent.

Detailed contract: `docs/work-lifecycle.md` in the installed project.
