# Sprints

A sprint is a time-bounded coordination bundle over canonical task IDs. Create one directory
per sprint:

```text
SPRINT-YYYY-MM-DD-slug/
├── sprint.json
├── lanes/
│   └── <lane>/
│       ├── brief.packet.json
│       ├── state.json
│       ├── log.jsonl
│       └── returns/
└── evidence/
```

`sprint.json` owns the objective, base ref, task membership, waves, lane write fences, and gates.
Lane state is execution state, not a duplicate task status. A generated board may join sprint,
lane, run, and task data for review.

The sprint executive owns `sprint.json`. Each lane owns only its declared lane paths. Close a
sprint with a receipted summary, linked run IDs, and an explicit archive path. Do not infer
closure from age or an empty agent roster, and do not create container directories that can be
mistaken for sprint IDs.
