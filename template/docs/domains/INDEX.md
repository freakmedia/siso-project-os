<!-- project-os-meta
{
  "schema_version": 1,
  "document_id": "route.domains",
  "path": "docs/domains/INDEX.md",
  "title": "Domain knowledge index",
  "kind": "index",
  "domain": "project-governance",
  "status": "current",
  "answers_question": "Where does durable knowledge for a subsystem belong?",
  "authority_key": "route.docs.domains",
  "owner": "project-maintainers",
  "created_at": "2026-07-29",
  "reviewed_at": "2026-07-29",
  "review_due_at": null,
  "canonical_pointer": "docs/domains/INDEX.md",
  "supersedes": [],
  "superseded_by": null,
  "source_pointers": ["docs/project-os/README.md"],
  "evidence": {
    "grade": "none",
    "observed_at": null,
    "proof_pointers": [],
    "verifier": null
  },
  "tags": ["routing", "domains"]
}
-->

# Domain knowledge

Durable subsystem knowledge belongs under one named domain:

```text
docs/domains/<domain>/
  INDEX.md
  canonical/
  specs/
  runbooks/
  research/
  audits/
  evidence/
```

The domain `INDEX.md` answers what the domain owns and routes each recurring question to one
current authored document. It may contain a delimited generated inventory block, but prose outside
that block is authored and must be preserved byte-for-byte by builders.

Rules:

- One non-null `authority_key` has at most one `current` owner.
- A stale document points to its replacement; it does not remain a competing answer.
- Dated observations support current guidance from `docs/runs/` or `evidence/`; they do not replace it.
- Research remains `unverified` until a closeout promotes a finding into a domain document,
  decision, proof claim, task evidence, or memory.
- Do not use a parent domain as a miscellaneous sink. Create the smallest domain that owns the
  question and give it an index.

The `project-os-meta` JSON comment above is a complete metadata example. It is parsed as JSON and
validated with `schemas/document.schema.json`; no YAML parser is required.
