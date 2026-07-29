# Knowledge pack contract

The Knowledge pack gives a repository one small router, typed durable homes, explicit document
currency, proof-bearing claims, bounded research packets, and deterministic discovery. It packages
the operating contract without importing any source project's product facts or document sprawl.

## Outcomes

A cold-pickup contributor should be able to answer five questions without reconstructing history
from chat:

1. Where does the current answer for this subsystem live?
2. What was decided, why, and what did it supersede?
3. Is a capability only proposed, code-tested, inspected, dark-observed, or observed in reality?
4. Was this question already researched, including its dead ends and coverage gaps?
5. Which generated view is stale, and which authored record must be changed to refresh it?

## Authored truth and generated views

| Concern | Canonical authored input | Generated view |
|---|---|---|
| Project routing | `AGENTS.md`, `PROJECT-OS.md`, `docs/project-os/README.md` | none required |
| Domain knowledge | `docs/domains/<domain>/` | corpus and domain indexes |
| Decisions | `docs/ledgers/decisions.jsonl` plus linked rationale | decision index |
| Proof | `docs/ledgers/proofs.jsonl` plus referenced artifacts | proof ledger and decay report |
| Prior-run discovery | `.agents/runs/*/run.json`, dated evidence, `docs/ledgers/runs.jsonl` | run index |
| Research | `docs/research/RESEARCH-*/packet.json` and evidence | research index |
| Archive | explicit archive manifests and retained files | archive inventory |

All generated outputs live under `.project-os/generated/`. A generated page may summarize, group,
rank, or link authored records. It cannot update a task, decision, claim, document status, packet,
or archive disposition.

## Document metadata

Durable Markdown carries a `project-os-meta` HTML comment containing JSON. JSON keeps parsing
dependency-free and lets the exact object validate against `schemas/document.schema.json`.

The required fields establish:

- a stable logical `document_id` and full repository-relative `path`;
- artifact `kind` and owning `domain`;
- semantic `status`, never inferred from filesystem modification time;
- the exact `answers_question` intent;
- a unique topic-level `authority_key` for current answers;
- owner and review dates;
- canonical and supersession pointers;
- evidence grade, observation time, proof pointers, and verifier;
- source pointers and tags.

The full relative path is the physical identity. A generator must not merge records by basename.
The corpus index computes a SHA-256 content digest for every source and an ordered input digest for
the projection. Modification time may be displayed as convenience metadata but cannot make a
document current.

### Currency rules

- `current` may direct new work and must own a non-null `authority_key`.
- `draft` is authored work that is not yet authoritative.
- `unverified` is an honest semantic gap; it is not automatically a defect.
- `stale` conflicts with or has been replaced by another answer and must point forward.
- `historical` preserves context or evidence but does not direct new work.

At most one `current` document may own an authority key. A check also verifies that a current
document's canonical pointer is itself and that a stale document does not point to itself. Those
cross-record comparisons are executable gates rather than claims JSON Schema can make alone.

## Two packet types

“Data packet” is deliberately split rather than overloaded.

### Agent packet

The lifecycle pack owns `schemas/agent-packet.schema.json`. An agent packet is an immutable,
run-scoped execution contract: objective, anchors, facts, decisions, constraints, actions, write
fence, verification, return contract, open questions, and stop conditions. It tells one lane what
to do without becoming durable domain knowledge.

### Research and evidence packet

The Knowledge pack owns `schemas/research-packet.schema.json`. A research packet records:

- question and scope, including exclusions;
- methods and individually identified sources;
- evidence-graded findings with source references and confidence;
- search coverage, incomplete areas, and explicit dead ends;
- clean-room and license boundaries;
- recommendations and evidence digests;
- raw receipts retained for recovery;
- closeout disposition for every output.

Its currency is `unverified`, `dated-evidence`, or `historical`. It can support a current answer but
cannot declare itself one. Closing research requires promotion or retention decisions, not merely a
synthesis paragraph.

## Proof currency and decay

Each line in `docs/ledgers/proofs.jsonl` validates against `schemas/claim.schema.json`. A claim
separates status from evidence grade. “Shipped” and “live-observed” are not interchangeable facts.

A proof record declares:

- stable `claim_id` and semantic `claim_key`;
- claim text and lifecycle status;
- evidence grade and observed/verified timestamps;
- proof commit when code provenance matters;
- every dependency path that can invalidate the observation;
- hashed proof artifacts;
- source, method, and verifier;
- expiry mode: dependency change, time, event, manual review, or never;
- supersession chain.

Proof decay is checked against Git. If a dependency changed after `proof_commit`, the claim becomes
`needs_review` in the generated health view. Detection does not silently rewrite the canonical
claim. A maintainer or state command records the new observation, stale ruling, or superseding claim.

Commit existence and path existence prove provenance only. They do not prove that the claim is
true; the evidence artifact and verification method carry that burden.

## Deterministic index provenance

Every generated projection records:

- schema version;
- generator name and version;
- source commit when available;
- ordered full relative input paths;
- SHA-256 digest of each input's bytes;
- one digest over the ordered input manifest;
- output digest.

The same authored bytes and generator version must produce the same bytes. Builders must not use
wall-clock time, local session databases, untracked files, network state, absolute paths, or
filesystem modification times as semantic inputs. A project may import external receipts only
through an explicit repo-local record with provenance.

`build` may write declared projections under `.project-os/generated/`. `check` computes expected
bytes in memory and reports drift without writing. A failing check cannot repair, move, archive,
banner, or otherwise mutate authored files.

## Closeout classification

At research or run close, every output is classified exactly once:

| Classification | Destination |
|---|---|
| Domain document | `docs/domains/<domain>/` |
| Decision | `docs/ledgers/decisions.jsonl` and optional rationale |
| Proof claim | `docs/ledgers/proofs.jsonl` |
| Task evidence | canonical task's `evidence/` |
| Memory | one file under `.agents/memory/` |
| Dated evidence | `docs/runs/YYYY-MM-DD--<slug>/` |
| Raw history | original run/research directory or explicit archive manifest |

A closed packet with an unclassified output fails validation. Promotion is additive and explicit;
it does not erase the source packet or pretend that raw evidence is current guidance.

## Anti-sprawl gates

The Knowledge pack fails new violations while reporting legacy debt separately:

1. Exactly one short boot router maps each question to one destination.
2. Every new durable document has schema-valid metadata.
3. No authority key has two current owners.
4. Every stale document names a non-stale canonical pointer.
5. Dated attempt/status documents are allowed only in dated evidence or agent-run homes.
6. Root `docs/` cannot accumulate durable subsystem facts.
7. Every domain has an authored index before receiving durable documents.
8. The generated corpus covers every live authored document exactly once.
9. Full paths, not basenames, join metadata and enrichment.
10. Every generated file names its generator and input digest.
11. Proof pointers, dependency paths, canonical pointers, task links, and closeout targets resolve.
12. Archive content cannot be a boot target or current canonical pointer.
13. Generated projections cannot be consumed as canonical inputs when authored records exist.
14. Documentation is scanned for credential material; only secret-manager references belong here.

## Detect is not repair

Checks and hooks are read-only. They may report stale projections, competing authority, proof decay,
missing pointers, unclassified closeout output, or archive candidates. They may not fix any of them.

Moves and folds use a two-step contract:

1. A read-only command writes or prints a manifest containing exact source paths, destinations,
   canonical-pointer updates, content digests, and information-loss warnings.
2. An explicit apply command accepts that reviewed manifest and refuses any source whose digest has
   changed since the plan.

This boundary is what keeps a useful detector from becoming an unsafe canonical writer.
