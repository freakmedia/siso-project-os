<!-- project-os-meta
{
  "schema_version": 1,
  "document_id": "route.decisions",
  "path": "docs/decisions/INDEX.md",
  "title": "Decision index",
  "kind": "index",
  "domain": "project-governance",
  "status": "current",
  "answers_question": "What has been decided, why, and what did it supersede?",
  "authority_key": "route.docs.decisions",
  "owner": "project-maintainers",
  "created_at": "2026-07-29",
  "reviewed_at": "2026-07-29",
  "review_due_at": null,
  "canonical_pointer": "docs/decisions/INDEX.md",
  "supersedes": [],
  "superseded_by": null,
  "source_pointers": ["docs/ledgers/decisions.jsonl"],
  "evidence": {
    "grade": "none",
    "observed_at": null,
    "proof_pointers": [],
    "verifier": null
  },
  "tags": ["routing", "decisions"]
}
-->

# Decisions

The canonical decision record stream is `docs/ledgers/decisions.jsonl`. Each append-only record
names its authority key, decision, rationale, date, approver, source paths, and any decision it
supersedes. Longer authored rationale may live beside this index and be referenced by the record.

Corrections are new records; do not silently rewrite why an old decision was made. The generated
decision view groups records by authority key and resolves the newest non-superseded record. A
generated page may display the ruling but cannot amend it.
