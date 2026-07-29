<!-- project-os-meta
{
  "schema_version": 1,
  "document_id": "route.onboarding",
  "path": "docs/project-os/ONBOARDING.md",
  "title": "Agent and human onboarding",
  "kind": "runbook",
  "domain": "project-governance",
  "status": "current",
  "answers_question": "How does an agent or human cold-pick up this repository and operate Project OS safely?",
  "authority_key": "route.project-os.onboarding",
  "owner": "project-maintainers",
  "created_at": "2026-07-29",
  "reviewed_at": "2026-07-29",
  "review_due_at": null,
  "canonical_pointer": "docs/project-os/ONBOARDING.md",
  "supersedes": [],
  "superseded_by": null,
  "source_pointers": ["AGENTS.md", "PROJECT-OS.html"],
  "evidence": {
    "grade": "none",
    "observed_at": null,
    "proof_pointers": [],
    "verifier": null
  },
  "tags": ["onboarding", "agents", "routing"]
}
-->

# Agent and human onboarding

Project OS gives every participant the same map while keeping one writer for each kind of truth.
The generated cockpit is a view. Tasks, sprints, runs, durable documents, decisions, and UI
campaign records remain canonical.

## Agent cold pickup

1. Read root `AGENTS.md`. Rules nearest the file you edit take precedence when a repository has
   nested agent instructions.
2. Read `PROJECT-OS.html`. It routes one question to one canonical destination.
3. Run `project-os onboard --json`. Stop and inspect any reported check errors before mutating
   state.
4. Select from `next_work`, then read that task's `task.json`, dependencies, acceptance criteria,
   affected files, events, and evidence.
5. Claim the task with `project-os task update ... --status in_progress`; create a linked run packet
   before a substantial execution attempt.
6. Respect the task/run file boundary and preserve unrelated dirty work.
7. Verify with executable commands, attach receipt pointers, update the task through the CLI,
   rebuild projections, and finish with `project-os check`.

If no unblocked task exists, create an outcome-shaped task or surface the blocker. Do not invent
a second TODO file.

## Human pickup

Open `.project-os/generated/onboarding.html`. The first decision surface is **Needs you**:

- tasks explicitly marked `requires_human`;
- blocked tasks and their recorded reason;
- UI campaigns waiting at the review stage.

The delivery trunk below it is generated from canonical records. Record a judgment in the owning
task or UI decision record, then run `project-os build`; never edit the HTML.

## New repository

```bash
npx github:sisodias/siso-project-os init . --name "Project name" \
  --summary "What this software is" --outcome "The user outcome it must create"
npx github:sisodias/siso-project-os onboard . --json
open .project-os/generated/onboarding.html
```

Create the first task with a concrete outcome and acceptance criteria. Add a sprint only when a
real delivery window groups multiple existing tasks.

## Existing repository

Run `init` the same way. It fails on ordinary file collisions instead of overwriting them. When
root `AGENTS.md` already exists, Project OS preserves it and stages its rules at
`.project-os/AGENTS.project-os.md`; a maintainer must merge those rules deliberately. Map any
external tracker in `.project-os/project.json`, but declare exactly one canonical writer.

## Before investigation or implementation

- Search `docs/domains/`, `docs/decisions/`, `docs/proven-recipes/`, and `.agents/memory/` before
  rediscovering a settled fact.
- Treat dated run documents as observations, not automatically current truth.
- Treat generated pages as navigation and status projections, never as authored authority.
- If a claim depends on code or proof that changed, re-verify it instead of repeating the claim.

## Refresh and prove

```bash
project-os build
project-os check --json
```

`build` writes only declared projections under `.project-os/generated/`. `check` is read-only and
fails on invalid records, broken references, stale projections, and proof or UI drift.
