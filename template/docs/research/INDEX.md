<!-- project-os-meta
{
  "schema_version": 1,
  "document_id": "route.research",
  "path": "docs/research/INDEX.md",
  "title": "Research index",
  "kind": "index",
  "domain": "project-governance",
  "status": "current",
  "answers_question": "What forward-looking research has already been attempted?",
  "authority_key": "route.docs.research",
  "owner": "project-maintainers",
  "created_at": "2026-07-29",
  "reviewed_at": "2026-07-29",
  "review_due_at": null,
  "canonical_pointer": "docs/research/INDEX.md",
  "supersedes": [],
  "superseded_by": null,
  "source_pointers": ["docs/project-os/README.md"],
  "evidence": {
    "grade": "none",
    "observed_at": null,
    "proof_pointers": [],
    "verifier": null
  },
  "tags": ["routing", "research"]
}
-->

# Research

Each bounded investigation gets one packet directory:

```text
docs/research/RESEARCH-<slug>/
  packet.json
  dossier.md
  evidence/
  raw/
```

`packet.json` follows `schemas/research-packet.schema.json`. It records scope, methods, sources,
findings, confidence, coverage gaps, dead ends, licensing boundaries, evidence digests, and
closeout dispositions. Research currency is always `unverified`, `dated-evidence`, or `historical`;
a research packet cannot declare itself current domain authority.

This is the research/evidence packet, distinct from the agent packet used to assign one execution
lane. Agent packets live with `.agents/runs/` and define objective, facts, constraints, write fence,
return shape, verification, and stop conditions. Research packets preserve what was learned and
what must not be re-searched.

At closeout, classify every output as a domain document, decision, proof claim, task evidence,
memory, dated evidence, or raw history. Unclassified output keeps the packet open.
