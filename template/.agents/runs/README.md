# Runs

A run is one immutable execution attempt linked to one or more canonical tasks and optionally a
sprint. Create one directory per run:

```text
RUN-YYYY-MM-DD-slug/
├── run.json
├── queue.json
├── ledger.jsonl
├── briefs/
├── returns/
└── evidence/
```

- `run.json` owns baseline, topology, units, constraints, receipts, gates, and its final closeout.
- `queue.json` may own dispatch order and attempt assignment. It never owns task completion.
- `ledger.jsonl` is append-only and records assignment, return, landing, gate, and blocker events.
- `briefs/` contains immutable run-scoped packets. Amend a dispatched packet with a new packet;
  do not silently rewrite its contract.
- `returns/` and `evidence/` preserve worker output and external receipts.
- the `run.json` closeout classifies every meaningful output as task evidence, durable documentation, a decision,
  memory, raw run history, or scratch.

Raw run history stays here. Promote only a durable cross-run lesson into `../memory/`.
