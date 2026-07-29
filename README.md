# SISO Project OS

A reusable, agent-first operating layer for a software project: canonical tasks, sprint and
run packets, a proof-aware documentation spine, a visual UI decision loop, and executable
anti-drift checks.

This is not another coding framework and it is not a global agent runtime. It installs the
small amount of project-local structure that lets Claude, Codex, MiniMax, humans, and future
agents pick up a repository without reconstructing its history from chat.

The source pattern is a large live agent-operated codebase described in `docs/provenance.md`. This package
keeps the proven contracts and deliberately drops source-project product facts, accumulated
history, and unsafe generator behavior.

## Four packs

1. **Work** — task JSON as canonical truth; lifecycle folders, evidence, append-only worklogs,
   sprints, run packets, handoffs, and durable memory.
2. **Knowledge** — one boot router, domain-owned durable docs, dated run evidence, decisions,
   research, proof currency, and deterministic indexes.
3. **UI Lab** — task-linked design campaigns from intent through divergent candidates,
   generated assets, review, a recorded verdict, implementation, and visual proof.
4. **Governance** — schemas, atomic allocation, read-only checks, derived projections, and
   anti-drift gates that make the other three packs enforceable.

## Intended command surface

```bash
npx github:sisodias/siso-project-os init .
npx github:sisodias/siso-project-os check .
npx github:sisodias/siso-project-os task create --title "Ship the thing"
npx github:sisodias/siso-project-os task update TASK-0001 --status in_progress --log "Started"
npx github:sisodias/siso-project-os sprint create --title "Launch"
npx github:sisodias/siso-project-os run create --task TASK-0001 --title "Implementation lane"
npx github:sisodias/siso-project-os ui create --task TASK-0001 --title "Checkout redesign"
npx github:sisodias/siso-project-os build .
```

The first release will remain dependency-free and non-destructive by default. Existing files
are never overwritten by `init`; collisions produce an adoption report and a non-zero exit.

## Status

The v0.1 package is implemented and verification-gated. See `SPEC.md` for the locked contract
and acceptance criteria, and run `npm test && npm run check && npm run smoke` for the local proof.

## Relationship to other SISO repositories

- `siso-agent-base` supplies the agent runtime and shared skills.
- `siso-agent-playbook` supplies fleet routing, budgets, briefs, and telemetry.
- `siso-project-os` supplies the reusable operating structure inside each product repository.
- legacy `agent_os` manages a different global agent/database concept and is not this package.

## License

MIT.
