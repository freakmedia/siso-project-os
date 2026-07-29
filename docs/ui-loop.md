# UI Lab operating loop

UI Lab turns a product task into comparable design directions, a durable human decision, a real application implementation, and verifiable proof. It is a design and review projection of work already owned by `.agents/tasks`; it is not a parallel backlog.

## Non-negotiable contract

Every campaign must reference one existing canonical task ID. The task remains authoritative for ownership, priority, dependencies, sprint placement, status, and closure. The campaign owns only UI-specific intent, research, alternatives, review evidence, the design decision, implementation receipt, and verification evidence.

The state sequence is fixed:

```text
intent → research → directions → candidates → review → decided → implemented → verified
```

`superseded` is a terminal history state available when a later campaign replaces an earlier one. Superseding preserves the old artifacts and explains the replacement; it does not rewrite history.

The canonical campaign record lives at `.uihub/campaigns/UI-####/campaign.json`. Static galleries and indexes are derived views and may be rebuilt.

## 1. Intent: bind the UI question to real work

Start from a canonical task. Write the user-visible outcome, audience, scenario, primary action, scope boundaries, and observable acceptance conditions. Name the real application surface and the source revision being observed.

An intent should express the product job without prematurely selecting a layout. “Help an operator notice and resolve the most urgent exception” is useful intent. “Add a red card on the right” is already a solution.

Advance only when:

- The campaign resolves to an existing `.agents/tasks` task.
- The audience, scenario, primary action, and surface are explicit.
- Scope and non-goals are recorded.
- Acceptance can be observed in the real application.

## 2. Research: establish current truth

Ground the design against the current product, code, data, and runtime before generating alternatives. Capture the current entry point, flow, source revision, screenshots, state transitions, data states, dependencies, and implementation constraints.

Classify each item of evidence:

- `current`: observed in the named source revision or running application.
- `proposal`: a possible future state.
- `reference`: an external or historical example that may inspire work but does not prove current behavior.

Never use a proposal screenshot to describe current product truth. Never silently convert an unknown into a requirement. Record unknowns and how they will be resolved.

The research packet should produce shared fixtures for comparison: screen IDs, copy, data, shell, states, and viewports. These become the fair-comparison contract for every direction.

## 3. Directions: diverge on a named axis

Create at least two meaningfully different theses before building candidates. Each direction names its primary divergence axis: information hierarchy, navigation model, interaction sequence, density strategy, progressive disclosure, or another material product choice.

Cosmetic variants of one layout are not divergent directions. A direction should explain:

- Its thesis.
- What is structurally different.
- Which constraints it satisfies.
- Its known tradeoffs.
- Whether it is a review candidate or a study-only exploration.

Authored, generated, and adapted directions all use the same schema. Origin never grants approval.

## 4. Candidates: make comparison fair

Produce concrete artifacts for each direction. A candidate can be a static prototype, image, flow, document, or another inspectable artifact. Every reviewed candidate must use the same:

- Screen IDs and product states.
- Copy fixture.
- Data fixture.
- Application shell and surrounding context.
- Viewports.
- Audience, scenario, and primary action.

Fair inputs let the reviewer judge the design choice rather than differences in content quality or scope. Label artifacts clearly and expose the thesis and tradeoffs next to the visual result.

Generated candidate output begins as evidence, not truth. Keep its instruction, inputs, hashes, output paths, and status in an adapter receipt. If it cannot meet the comparison contract, label it `study_only` and exclude it from the decision set.

## 5. Review: collect a human response without hidden writes

Build a static review page or gallery that works from local files or ordinary static hosting. It should show the decision context, comparable candidates, and an explicit selection control. It must not require a writable review server.

The starter review page downloads a JSON response. Commit that response under the campaign's `review/` directory. Keep the reviewer's exact words in `verbatim_notes`; add interpretation later in the decision rationale so the two cannot be confused.

Review responses are evidence, not the final decision record. Before advancing, confirm that the chosen ID exists, every rejected reviewed direction is named, and the reviewer identity and timestamp are present.

## 6. Decided: freeze the choice and implementation target

Create a decision record that contains:

- The chosen direction ID.
- All rejected direction IDs.
- The reason the chosen direction best serves the audience, constraints, and primary action.
- Approver and timestamp.
- Link to the raw review response.
- Real application paths and acceptance conditions.
- Verbatim notes and any explicitly approved exceptions.

Do not edit an old decision to represent a change of mind. Add a replacement record and use `supersedes`, or supersede the whole campaign when the intent has materially changed.

## 7. Implemented: move the decision into the real application

The prototype is not the product. Implement the chosen direction in the actual target paths and preserve existing behavior outside the decision's scope.

The implementation receipt records:

- Target paths and changed files.
- Source revision.
- Closest project checks and their verdicts.
- A real application observation with scenario and viewports.
- Deviations from the chosen candidate.
- Unresolved items.
- Evidence paths and approved exceptions.

If only the prototype changed, the campaign has not reached `implemented`. If the implementation intentionally diverges, state why instead of quietly updating the design artifact after the fact.

## 8. Verified: prove the running surface

Verify at the source revision recorded in the receipt. Proof should exercise the chosen acceptance conditions in the running application and cover the agreed viewports and product states.

At minimum, record:

- Executable checks with command, verdict, and evidence.
- Screenshots or equivalent visual evidence from the running application.
- Console errors and page errors.
- Broken assets.
- Horizontal overflow or other responsive violations.
- Any approved exception with owner and reason.

Screenshots alone do not prove behavior, and a passing build alone does not prove the UI. Use both executable and visual evidence. A failing or blocked check remains visible in the receipt; do not advance by deleting it.

## Fold the result back into the canonical task

After implementation or verification, append a concise entry to the canonical task's execution log with:

- Campaign ID and final state.
- Decision record path.
- Implementation and verification receipt paths.
- Source revision.
- Remaining exceptions or follow-up work.

The campaign may satisfy one acceptance condition without completing the entire task. Task closure remains governed by the canonical task's full acceptance and lifecycle rules.

## Optional adapter contract

Adapters are replaceable helpers around the core loop. The project remains operable when every adapter is unavailable.

An adapter capability manifest declares:

- Capability rather than provider branding.
- Availability and external credential mode.
- Accepted inputs and output media types.
- Default output eligibility.
- Known limits and fallback behavior.

Every invocation immediately creates a receipt with the exact instruction, input paths and hashes, output paths, timestamps, status, and eligibility. Secrets, tokens, SDK caches, and provider runtime code do not belong in `.uihub`.

Raw adapter output never advances campaign state by itself. A human review and durable decision are still required.

## Artifact placement

Use the following campaign shape:

```text
.uihub/campaigns/UI-0001/
├── campaign.json
├── intent/
│   └── brief.md
├── research/
│   ├── findings.md
│   └── fixtures/
├── directions/
│   └── DIR-A.json
├── candidates/
│   └── CAN-A/
├── review/
│   ├── index.html
│   └── response.json
├── decided/
│   └── decision.json
├── implemented/
│   └── receipt.json
└── verified/
    ├── receipt.json
    └── evidence/
```

Paths inside JSON records are repository-relative. Generated indexes belong in `.uihub/generated/` and must be reproducible from campaign records.

## Completion test

A UI campaign is complete when its canonical task linkage is valid, its decision trail is durable, the selected direction exists in the real application, verification passes at the recorded revision, and the result has been folded into the canonical task. A polished gallery without those conditions is a useful study, not a completed campaign.
