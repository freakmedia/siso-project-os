# Work lifecycle

The Work pack gives `{{PROJECT_NAME}}` one durable, inspectable answer to five questions:

1. What work exists?
2. How is a group of tasks coordinated?
3. What happened in one execution attempt?
4. What exactly was an agent authorized to do?
5. Which lesson must survive the run that discovered it?

The corresponding canonical records are tasks, sprints, runs, packets, and memory. Generated
boards and dashboards may join those records, but they never become writers.

## Canonical ownership

| Concern | Canonical record | Projection or read surface |
| --- | --- | --- |
| Work item | `.agents/tasks/<state>/TASK-NNNN/task.json` | task page, task index, dashboard |
| Sprint | `.agents/sprints/SPRINT-*/sprint.json` | sprint board |
| Run attempt | `.agents/runs/RUN-*/run.json`, packets, receipts, ledger | run summary |
| Live resume | `.agents/briefs/CURRENT.md` and indexed immutable snapshots | operator dashboard |
| Durable lesson | `.agents/memory/<slug>.md` | generated memory index |

When two surfaces disagree, the canonical record wins and `check` reports the projection as
stale. A check may diagnose drift; it must not silently repair authored records.

## Task state machine

Hard statuses are deliberately small:

```text
backlog → in_progress ↔ blocked → completed
    │           │          │
    └───────────┴──────────┴────────→ cancelled
```

Allowed transitions are:

| From | To | Required evidence |
| --- | --- | --- |
| `backlog` | `in_progress` | owner, claim time, dependencies complete |
| `in_progress` | `blocked` | blocker reason, start time, required unblocker |
| `blocked` | `in_progress` | resolved blocker and an execution-log entry |
| `in_progress` | `completed` | acceptance evidence plus passed or waived verification |
| non-terminal | `cancelled` | actor, time, and reason |

Every hard status has a same-named lifecycle folder. Moving state means updating `task.json`,
appending the execution event, and moving the entire task directory atomically. `archived/` is
a recoverable storage disposition for completed or cancelled records; it preserves the terminal
status and records the previous folder.

Task IDs are monotonic four-digit addresses. Creation must hold an exclusive registry lock,
scan all lifecycle and archive folders, reject duplicate or mismatched IDs, write into a temporary
directory, and atomically rename it into `backlog/`. A stale lock is an error to investigate, not
permission to steal it.

Domain and category are open kebab-case strings: the tool warns on unfamiliar values but allows
the project taxonomy to grow. Status and priority are closed enums. Human authorization is an
explicit field, never inferred from title wording.

The task's `events.jsonl` is a concise append-only timeline beside `task.json`. Put detailed transcripts, repeated
measurements, and attempt-specific checkpoints in a linked run so `task.json` remains a useful
current-state record.

## Sprints coordinate; they do not duplicate tasks

A sprint groups existing task IDs around one objective and base ref. `sprint.json` records:

- task membership;
- dependency-driven waves and why that order is required;
- lane ownership and non-overlapping write fences;
- lane dependencies and packet/state paths;
- sprint-wide verification gates;
- start and closeout receipts.

The sprint executive owns the sprint record. A lane owns only its lane state, append-only log,
returns, and declared write paths. Lane status describes the attempt, not whether the canonical
task is complete. Closure is explicit and linked to the runs that delivered the sprint.

## Runs preserve attempts

A run freezes an execution attempt's objective, base ref, task links, constraints, units,
packets, and gates. Run unit states such as `ready`, `running`, `returned`, and `landed` are an
attempt dimension; they must not overwrite task status.

The run ledger is append-only. Record assignments, amendments, blockers, returns, independent
verification, landings, and closeout. Worker reports are inputs. Commit identities, command exit
codes, observed surfaces, and evidence artifacts are verdicts.

Closeout classifies each meaningful output:

| Classification | Destination |
| --- | --- |
| `task_evidence` | the linked task's evidence or completion record |
| `durable_doc` | the owning project documentation domain |
| `decision` | the project decision store |
| `memory` | one fact in `.agents/memory/` |
| `raw_run_history` | retained in the run |
| `scratch` | explicitly disposable after closeout policy permits it |

A run is not complete merely because every agent stopped. Its units need terminal dispositions,
required gates need receipts, and the output classification must be written.

## Packets are immutable bounded contracts

An agent packet is a run-scoped instruction contract. It carries:

- recipient, sender, thread, objective, state, and operating mode;
- parent task, sprint, and run IDs;
- anchors to read before action;
- known facts and binding decisions;
- constraints and an explicit write fence;
- bounded actions and verification checks;
- open questions;
- a return destination and required return fields;
- stop conditions.

Dispatch freezes a packet. If a fact or decision changes, issue a new packet with `amends` rather
than silently rewriting the instructions an active or completed worker received. Packets belong
under their run, not in a global brief pile.

## Live briefs versus durable memory

`briefs/CURRENT.md` is a narrow resume pointer. It should say what is active and where truth lives,
not accumulate a parallel history. Immutable snapshots capture meaningful lead-state transitions
and are linked from the current pointer.

Memory is first-class durable project knowledge. Promote a finding only when it will change how a
future run should reason or act. One memory file holds one fact, proof pointers, dependency paths,
and application guidance. Supersede or retract memories explicitly; never leave a contradicted
top-line claim active.

## Required integrity gates

`project-os check` should fail on:

1. duplicate task IDs anywhere, including archives;
2. a task directory whose name, embedded ID, status, or folder disagrees;
3. missing dependencies or a cyclic dependency graph;
4. a completed task without acceptance and verification evidence;
5. a sprint, run, packet, or campaign referencing a missing task;
6. overlapping sprint write fences without explicit sequencing;
7. a packet missing anchors, constraints, return contract, write fence, or stop condition;
8. a terminal run without closeout output classifications;
9. invalid or unresolved memory evidence and supersession pointers;
10. a stale or hand-edited generated projection.

Mutations use explicit commands. Hooks and CI call read-only checks; they do not repair records.

## Anti-patterns

- Maintaining a second task list inside a sprint, run, dashboard, or UI tool.
- Allocating task IDs by scan-then-write without an exclusive lock.
- Treating folder location and embedded status as independent truths.
- Encoding human authorization in title regexes or lane-name conventions.
- Letting attempt logs grow without bound inside the task snapshot.
- Hand-editing generated boards or indexes.
- Swallowing projection-generation failures and leaving an apparently current dashboard.
- Storing run packets in a flat global brief directory.
- Turning live resume notes into a giant archive of superseded status.
- Treating a worker's completion claim as verification.
- Making archive destructive or replacing the prior terminal state with an `archived` status.
- Copying project-specific role names, machine paths, fixed lane counts, or product facts into the
  reusable contract.

The desired outcome is simple: a cold agent can find the current task, its coordination context,
its exact write authority, its proof bar, its return destination, and the durable lessons that
apply without reconstructing project history from chat.
