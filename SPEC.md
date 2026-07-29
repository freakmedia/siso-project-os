# SISO Project OS v0.1 Specification

Status: implementation contract
Date: 2026-07-29

## Objective

Turn repeatable operating patterns proven in the source project into a clean package that
can initialize and validate any software repository without importing Oracle's product state.

## Non-goals

- Prescribing application code architecture; `agent-architecture` already owns that domain.
- Replacing GitHub Issues, Linear, Beads, or another external tracker. Adapters may mirror them;
  the installed project tree still needs one declared canonical writer.
- Shipping the source project's dashboard corpus, design assets, proofs, customer data, or historical runs.
- Managing global agent identities, model routing, budgets, terminals, or credentials.
- Auto-repairing authored files during `check`, hooks, or CI.

## Ownership model

| Concern | Canonical writer | Derived/read surface |
|---|---|---|
| Work item | `.agents/tasks/<state>/TASK-NNNN/task.json` | task HTML, task index, dashboards |
| Sprint | `.agents/sprints/SPRINT-*/sprint.json` | sprint board HTML/JSON |
| Run | `.agents/runs/RUN-*/run.json` + packets/receipts | run index and summaries |
| Durable lesson | `.agents/memory/<slug>.md` | generated memory index |
| Project routes | root `AGENTS.md` plus `docs/README.md` | tool-specific bridges |
| Durable domain knowledge | `docs/domains/<domain>/` | corpus doc index |
| Evidence | task-local `evidence/` or dated `docs/runs/` | proof ledger/index |
| Decision | `docs/decisions/` | decision index |
| UI campaign | `.uihub/campaigns/UI-*/campaign.json` | galleries/review pages |
| Generated state | `.project-os/generated/` | never canonical |

## Work lifecycle

Hard statuses are `backlog`, `in_progress`, `blocked`, `completed`, and `cancelled`.
Folder state must agree with `task.json.status`. A task update appends an execution-log entry,
then moves the complete task directory atomically when the lifecycle folder changes.

Task identifiers are four-digit monotonic IDs for human addressability. Allocation must hold an
exclusive `.agents/tasks/.locks/registry.lock`, scan every lifecycle folder including archived
or cancelled work, validate directory and embedded IDs, create through a temporary directory,
then release the lock in `finally`. A stale lock is reported, not silently stolen.

Domain and category taxonomies are open strings with typo warnings. Status and priority are hard
enums. Every task supports dependencies, acceptance criteria, affected-file pointers, evidence,
verification state, and an append-only execution log.

## Sprint and run contracts

A sprint is a time-bounded coordination bundle over existing task IDs. It does not own a second
task list. A run is an immutable execution attempt linked to one or more tasks and optionally a
sprint. Run packets carry objective, anchors, facts, decisions, constraints, actions, verification,
and open questions. Closeout classifies outputs into task evidence, durable docs, decisions,
memory, or raw run history.

## Documentation spine

The boot layer is short Markdown that points to one destination per question. Durable docs live
by domain and artifact type. Volatile execution evidence is dated. Decisions are append-only
records. Proof-bearing claims include evidence grade, observed/verified date, provenance, and
dependency paths so staleness can be checked against Git.

The generated doc index is corpus-complete and deterministic. It may derive structural metadata
from paths and in-file metadata but must call semantic currency `unverified` when it cannot know.
Generated pages never assert authority over authored source files.

## UI campaign lifecycle

Every UI campaign links a canonical task ID and moves through explicit stages:

`intent -> research -> directions -> candidates -> review -> decided -> implemented -> verified`

Candidates and generated images are artifacts, not source-of-truth decisions. The decision record
captures the chosen direction, rejected alternatives, rationale, approver, and implementation
target. Verification includes executable checks plus visual evidence or a recorded exception.
Image generation and third-party design tools are optional adapters.

## Governance commands

- `init` installs the starter tree without overwriting collisions.
- `check` is read-only and validates structure, schemas, references, duplicate IDs, lifecycle
  agreement, canonical routes, generated drift, proof metadata, and UI/task links.
- `build` regenerates projections only under declared generated outputs.
- `task create|update`, `sprint create`, `run create|close`, and `ui create|advance` are the only
  supported state mutations in v0.1.
- `repair` is explicit, narrowly targeted, and not invoked by hooks or CI.

## Acceptance criteria

1. `npm test` covers init, collision handling, atomic task creation, task movement, duplicate-ID
   rejection, invalid cross-references, deterministic builds, and read-only checks.
2. A smoke test initializes a clean temporary repository, creates/updates a task, creates a sprint,
   run, and UI campaign, builds projections, and passes `check`.
3. A dirty fixture with duplicate task IDs, folder/status mismatch, stale projection, and a UI
   campaign pointing to a missing task fails with machine-readable verdicts.
4. `npm pack --dry-run` contains only runtime, templates, docs, schemas, and license files.
5. No source file contains Oracle platform names, credentials, absolute user paths, or copied
   customer/product evidence outside the provenance document.
6. The GitHub repository is pushed and can be installed from its URL into a new temporary project.
