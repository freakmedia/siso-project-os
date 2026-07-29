<!-- project-os-meta
{
  "schema_version": 1,
  "document_id": "route.proven-recipes",
  "path": "docs/proven-recipes/INDEX.md",
  "title": "Proven recipes index",
  "kind": "index",
  "domain": "project-governance",
  "status": "current",
  "answers_question": "Which reusable procedures have executable or observed proof?",
  "authority_key": "route.docs.proven-recipes",
  "owner": "project-maintainers",
  "created_at": "2026-07-29",
  "reviewed_at": "2026-07-29",
  "review_due_at": null,
  "canonical_pointer": "docs/proven-recipes/INDEX.md",
  "supersedes": [],
  "superseded_by": null,
  "source_pointers": ["docs/ledgers/proofs.jsonl"],
  "evidence": {
    "grade": "none",
    "observed_at": null,
    "proof_pointers": [],
    "verifier": null
  },
  "tags": ["routing", "recipes", "proof"]
}
-->

# Proven recipes

A recipe is a reusable procedure whose preconditions, commands, success signal, rollback, and
known failure modes are explicit. Every recipe cites at least one claim in
`docs/ledgers/proofs.jsonl` and declares the dependency paths whose changes require re-verification.

Do not call a procedure proven because its code exists or a prior agent reported success. Use the
evidence grade from the claim record and preserve the difference between tests, inspected wiring,
dark observation, and real execution.
