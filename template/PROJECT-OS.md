# {{PROJECT_NAME}} — Project Operating Map

<!-- siso-project-os:v1 -->

| Question | Canonical destination |
|---|---|
| What work exists and what is its state? | `.agents/tasks/` |
| What work is grouped into the current delivery window? | `.agents/sprints/` |
| What happened in a particular execution attempt? | `.agents/runs/` |
| What durable lesson must future agents know? | `.agents/memory/` |
| Where does durable subsystem knowledge live? | `docs/domains/` |
| Where are dated observations and proof receipts? | `docs/runs/` and task-local `evidence/` |
| What decisions are binding and why? | `docs/decisions/` |
| Where are UI directions, decisions, and proof? | `.uihub/campaigns/` |
| Where are generated indexes? | `.project-os/generated/` — projections only |

## Commands

```bash
project-os task create --title "Describe the outcome"
project-os task update TASK-0001 --by agent-name --status in_progress --log "Started"
project-os sprint create --title "Delivery window" --tasks TASK-0001
project-os run create --title "Implementation attempt" --task TASK-0001
project-os ui create --title "Surface redesign" --task TASK-0001
project-os build
project-os check
```

Do not create parallel task lists, dated status hubs, or hand-maintained generated indexes.
