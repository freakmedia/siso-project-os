<!-- project-os-meta
{
  "schema_version": 1,
  "document_id": "route.archive",
  "path": "docs/archive/INDEX.md",
  "title": "Documentation archive index",
  "kind": "index",
  "domain": "project-governance",
  "status": "current",
  "answers_question": "Where is superseded documentation retained for historical recovery?",
  "authority_key": "route.docs.archive",
  "owner": "project-maintainers",
  "created_at": "2026-07-29",
  "reviewed_at": "2026-07-29",
  "review_due_at": null,
  "canonical_pointer": "docs/archive/INDEX.md",
  "supersedes": [],
  "superseded_by": null,
  "source_pointers": ["docs/project-os/README.md"],
  "evidence": {
    "grade": "none",
    "observed_at": null,
    "proof_pointers": [],
    "verifier": null
  },
  "tags": ["routing", "archive"]
}
-->

# Archive

This directory retains superseded documentation and raw historical material. Nothing here is a
current answer, boot destination, or generator input for semantic truth.

Archive operations are explicit and manifest-gated:

1. `fold plan` or `archive plan` produces a read-only manifest.
2. A maintainer reviews canonical pointers and information-loss risk.
3. `fold apply <manifest>` or `archive apply <manifest>` performs only the approved moves.
4. The build refreshes a generated archive inventory under `.project-os/generated/`.

Checks may report archive candidates but may not move, banner, rewrite, or delete them.
