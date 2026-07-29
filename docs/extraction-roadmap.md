# Extraction roadmap

Project OS v0.2 extracts the reusable project-local contracts for cold pickup, canonical work,
knowledge, UI campaigns, and deterministic governance. The source system contains further proven
patterns, but they should be reimplemented as generic contracts rather than copied as
project-specific scripts.

## Shipped in v0.2

- One binding boot order across agent rules, the operating map, CLI, durable onboarding guide,
  and generated HTML.
- A read-only `onboard --json` report with live check verdict, human-attention queue, dependency-
  ready work, and canonical links.
- A bounded, responsive, deterministic HTML cockpit with project outcome, active delivery,
  stable DOM contracts, embedded JSON, and a read-only browser verifier.
- Canonical task/sprint/run/UI records, proof-aware docs, schemas, atomic task allocation, and
  anti-drift checking.

## P0 — execution integrity

These are the highest-value remaining per-project contracts:

1. **Structured resume snapshots and mission ownership**
   - Schema for immutable UTC lead-state snapshots.
   - Generated newest-first history and one checked `CURRENT` pointer.
   - Explicit mission acquire/status/release with fail-closed stale-lock handling.

2. **Executable sprint and run lifecycle**
   - Sprint start, lane update, gate receipt, close, and archive commands.
   - Run unit, immutable packet, amendment, return, gate, event, and closeout commands.
   - Checkers for packet immutability, ledger ordering, terminal unit census, lane receipts,
     return completeness, and closeout output classification.

3. **Write-set reservation**
   - A work-claim schema distinct from proof claims.
   - Normalized repository-relative paths, ancestor/descendant intersection checks, atomic
     claim/pull/release, and dependency-aware task selection.
   - Reservations remain held through build, verification, fix, and re-verification.

4. **Candidate → independent verification → serialized landing**
   - Separate actor and verifier identities.
   - Candidate/base commit, declared and actual diff, gate receipts, kickback history, landed
     commit, and remote equality proof.
   - One serialized landing path; a worker result is never itself completion proof.

## P1 — safe delivery adapters

- **Worktree attempt contract:** revalidated base commit, detached attempt checkout, cleanliness
  checks, names-only local prerequisite manifest, and bootstrap receipt. Secret copying and
  machine-specific paths remain adapters.
- **Landing plan artifact:** ordered refs, invariants, conflict decisions, regeneration steps,
  gates, unresolved human calls, and final receipts.
- **Safe task archive:** reason, actor, dry-run, duplicate/destination refusal, prior terminal
  folder retention, atomic move, and event log.
- **Durable failure taxonomy:** every attempt ends as landed, artifact-only, prepared, or a typed
  blocked result with retained evidence and a next-attempt policy.

## P1 — knowledge and orientation

- Change-oriented edit maps: change type → normal files → boundaries → cheapest check → full
  verification.
- Stable repository facts kept separate from volatile project status.
- Generated human docs-corpus HTML alongside the existing corpus-complete JSON.
- Anti-amnesia discovery that surfaces current decisions, prior research, dead ends, proof
  currency, and relevant durable memory before a new investigation.
- A teach-back/orientation receipt: product outcome, current objective, selected task and write
  fence, first action, proof bar, and stop/human gate.
- An explicit project-journey schema before attempting to derive a single global “current phase”
  from a mixed task registry.

## P1 — complete the UI decision loop

- Deterministic campaign gallery/review generation.
- Candidate manifests proving shared fixtures, inputs, viewports, source commit, and render hashes.
- Review-response schema plus an import command that writes the durable decision.
- Active and archived review-inbox projection without browser-local state.
- Adapter capability/receipt schemas and checker coverage.
- A task-fold invariant: verified UI work must appear in the owning task's evidence before close.
- Reusable browser/runtime/visual proof production and stricter decision completeness.

## Deliberate boundaries

Project OS should not absorb global fleet telemetry, model routing, token budgets, terminal/session
control, credentials, or transcript/cost reconstruction; those belong to Agent Base and the agent
playbook. It also does not prescribe application code architecture; the `agent-architecture`
package owns that domain.

The extraction rule is: preserve the invariant and the evidence chain, replace product facts with
schemas and adapters, and prove every generated surface against its canonical inputs.
