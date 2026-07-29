<!-- project-os-meta
{
  "schema_version": 1,
  "document_id": "route.project-os",
  "path": "docs/project-os/README.md",
  "title": "Knowledge spine router",
  "kind": "index",
  "domain": "project-governance",
  "status": "current",
  "answers_question": "How is durable project knowledge routed and governed?",
  "authority_key": "route.docs.project-os",
  "owner": "project-maintainers",
  "created_at": "2026-07-29",
  "reviewed_at": "2026-07-29",
  "review_due_at": null,
  "canonical_pointer": "docs/project-os/README.md",
  "supersedes": [],
  "superseded_by": null,
  "source_pointers": ["PROJECT-OS.html"],
  "evidence": {
    "grade": "none",
    "observed_at": null,
    "proof_pointers": [],
    "verifier": null
  },
  "tags": ["routing", "governance"]
}
-->

# Knowledge spine

This project uses one short router plus typed homes:

- `docs/domains/<domain>/` — durable current knowledge.
- `docs/runs/` — dated observations and execution evidence.
- `docs/research/` — explicitly unverified forward-looking work.
- `docs/decisions/` — immutable decisions and superseding corrections.
- `docs/proven-recipes/` — reusable procedures with proof metadata.
- `.agents/memory/` — one durable cross-run lesson per file.

Generated discovery lives under `.project-os/generated/`. It is a projection of disk and must
never become a second documentation authority.
