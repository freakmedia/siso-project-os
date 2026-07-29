# UI Lab

This directory holds task-linked UI design campaigns. It supports divergent design, human review, implementation in the real application, and proof without becoming a second task system.

## Source of truth

Every campaign has one `task_id` that resolves to a canonical task under `.agents/tasks/`. Campaign files contain design evidence and decisions; task ownership, priority, lifecycle, and closure remain in that canonical task.

The campaign state sequence is:

`intent → research → directions → candidates → review → decided → implemented → verified`

`superseded` is a terminal history state. It does not delete or rewrite the earlier decision trail.

## Layout

```text
.uihub/
├── README.md
├── _templates/          # copy-on-create starter records
├── adapters/            # optional capability manifests and generation receipts
├── campaigns/           # UI-#### campaign directories
└── generated/           # disposable indexes and galleries
```

Within a campaign, keep the stage folders explicit:

```text
campaigns/UI-0001/
├── campaign.json
├── intent/
├── research/
├── directions/
├── candidates/
├── review/
├── decided/
├── implemented/
└── verified/
```

Copy the files in `_templates/` when creating a campaign. Replace every placeholder, keep repository-relative paths, and validate records against the schemas installed with SISO Project OS.

## Rules

- Preserve the current product truth before proposing a replacement.
- Compare directions with the same screens, copy, data, shell, and viewports.
- Keep raw reviewer words separate from the design team's interpretation.
- Treat generated output as an artifact, never as an approval.
- Record implementation against real application paths and a source revision.
- Verify the running application, including browser faults and responsive states.
- Fold the result back into the canonical task execution log.
- Keep secrets and provider SDKs outside this directory.

See `docs/ui-loop.md` in the installed project for the complete operating loop.
