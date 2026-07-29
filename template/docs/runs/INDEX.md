<!-- project-os-meta
{
  "schema_version": 1,
  "document_id": "route.runs",
  "path": "docs/runs/INDEX.md",
  "title": "Dated evidence index",
  "kind": "index",
  "domain": "project-governance",
  "status": "current",
  "answers_question": "Where are dated observations and proof receipts stored?",
  "authority_key": "route.docs.runs",
  "owner": "project-maintainers",
  "created_at": "2026-07-29",
  "reviewed_at": "2026-07-29",
  "review_due_at": null,
  "canonical_pointer": "docs/runs/INDEX.md",
  "supersedes": [],
  "superseded_by": null,
  "source_pointers": ["docs/project-os/README.md"],
  "evidence": {
    "grade": "none",
    "observed_at": null,
    "proof_pointers": [],
    "verifier": null
  },
  "tags": ["routing", "evidence", "runs"]
}
-->

# Dated evidence

Use `docs/runs/YYYY-MM-DD--<slug>/` for a point-in-time observation that future agents may need to
inspect. A typical directory contains a short `summary.md`, hashed evidence, and a `raw/` folder for
receipts that should be preserved but not treated as conclusions.

This home is different from `.agents/runs/`:

- `.agents/runs/` records how an execution attempt was coordinated.
- `docs/runs/` records dated evidence that durable guidance or proof claims cite.

A run summary never becomes current subsystem instruction merely because it is newer. Promote the
durable result through explicit closeout, then link the dated evidence from the current domain doc
or proof claim.
