<!-- project-os-meta
{
  "schema_version": 1,
  "document_id": "route.ledgers",
  "path": "docs/ledgers/INDEX.md",
  "title": "Structured knowledge ledgers",
  "kind": "index",
  "domain": "project-governance",
  "status": "current",
  "answers_question": "Which structured records back decisions, proof, and prior-run discovery?",
  "authority_key": "route.docs.ledgers",
  "owner": "project-maintainers",
  "created_at": "2026-07-29",
  "reviewed_at": "2026-07-29",
  "review_due_at": null,
  "canonical_pointer": "docs/ledgers/INDEX.md",
  "supersedes": [],
  "superseded_by": null,
  "source_pointers": ["docs/project-os/README.md"],
  "evidence": {
    "grade": "none",
    "observed_at": null,
    "proof_pointers": [],
    "verifier": null
  },
  "tags": ["routing", "ledgers"]
}
-->

# Structured knowledge ledgers

These newline-delimited JSON files are authored canonical records:

- `decisions.jsonl` — immutable records validated by `decision.schema.json`;
- `proofs.jsonl` — proof-bearing claims validated by `schemas/claim.schema.json`;
- `runs.jsonl` — compact receipts validated by `run-discovery.schema.json`.

Each line is one complete JSON object. Empty ledgers are valid. Append through a Project OS state
command rather than editing generated HTML. A run discovery receipt links to the canonical
`.agents/runs/<run>/run.json`; it summarizes the question and conclusion but does not duplicate
mutable run status.

Human-readable tables under `.project-os/generated/` are projections. Builders consume these
records, sort deterministically, and include input digests. They never feed changes back into the
ledgers.
