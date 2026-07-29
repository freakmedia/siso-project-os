# {{PROJECT_NAME}} — What Lives Where

<!-- siso-project-os:architecture-v1 -->

This is the stable first-read map. It describes ownership and dependency direction; generated status
belongs in `.project-os/generated/`, not here. Extend this map when real domains appear instead of
reserving speculative folders.

```text
.
├── AGENTS.md                 # binding repository rules; nearest nested AGENTS.md wins
├── PROJECT-OS.md             # question → canonical project-state destination
├── FILE-TREE.md              # this architecture and ownership map
├── script/                   # normalized bootstrap/setup/test/server/update entrypoints
├── .project-os/              # Project Kit configuration, schemas, baselines, generated views
├── .agents/                  # canonical work, execution attempts, packets, memory, capabilities
├── .uihub/                   # task-linked UI campaigns, decisions, and visual proof
└── docs/                     # domain knowledge, decisions, research, run evidence, recipes
```

## Code placement contract

- Partition application code by domain or feature, not one repository-wide technical layer.
- A named domain folder is a dependency boundary. Cross-domain access uses its declared public contract.
- Generated or derived code lives in an isolated sibling path and is never mixed with authored source.
- Add nested `AGENTS.md` only where a subtree has real local invariants; do not create decorative copies.
- Record the project-specific code tree below once it exists. Folder names are stable addresses.

## Project-specific domains

No domains have been declared yet. Add one line per real domain with its public surface and cheapest
verification command.
