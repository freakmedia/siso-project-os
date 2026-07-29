# Task registry

Each work item has one canonical directory and one canonical `task.json`:

```text
.agents/tasks/<lifecycle>/TASK-NNNN/
├── task.json
├── events.jsonl
└── evidence/
```

## Lifecycle folders

| `task.json.status` | Folder |
| --- | --- |
| `backlog` | `backlog/` |
| `in_progress` | `in_progress/` |
| `blocked` | `blocked/` |
| `completed` | `completed/` |
| `cancelled` | `cancelled/` |

`archived/` is a storage disposition for completed or cancelled records. Archiving preserves
the terminal status and adds archive metadata; it does not invent an `archived` task status.

## Rules

1. Create and update tasks through the CLI. Never hand-allocate an ID.
2. ID allocation holds `.locks/registry.lock` and scans every lifecycle folder, including
   `archived/`.
3. Directory name, embedded task ID, status, and lifecycle folder must agree.
4. A sprint or run references task IDs; it does not copy task state into another registry.
5. Keep `events.jsonl` entries short and receipted. Large transcripts and attempt-specific
   checkpoints belong in the linked run.
6. Completion requires acceptance evidence and a passed or explicitly waived verification.

Task HTML and backlog dashboards are generated views. Edit `task.json`, never the projections.
