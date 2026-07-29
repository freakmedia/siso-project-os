# Onboard a project with SISO Project OS

This is the package-level setup guide. Each initialized repository receives its own durable guide
at `docs/project-os/ONBOARDING.md` and a generated cockpit at
`.project-os/generated/onboarding.html`.

## Install into a new project

```bash
cd /path/to/project
npx github:sisodias/siso-project-os init . --name "Project name" \
  --summary "What this software is" --outcome "The user outcome it must create"
npx github:sisodias/siso-project-os onboard . --json
open .project-os/generated/onboarding.html
```

Commit the installed operating structure with the project. Agents can use the GitHub `npx`
command directly, or a team can pin the package in `devDependencies` and expose `project-os`
through local scripts.

## Adopt an existing project

`init` is deliberately collision-intolerant. Use `--dry-run` first when adopting a mature repo:

```bash
npx github:sisodias/siso-project-os init . --name "Project name" --dry-run --json
```

Ordinary collisions stop the install without a partial write. An existing root `AGENTS.md` is the
one exception: it is preserved, and the Project OS block is staged at
`.project-os/AGENTS.project-os.md` for deliberate merging. After adoption:

1. declare the timeless project summary, desired outcome, and task authority in
   `.project-os/project.json`;
2. create or import canonical tasks rather than maintaining two backlogs;
3. route durable subsystem docs under `docs/domains/`;
4. run `project-os build && project-os check`;
5. open the cockpit and verify the human-attention and next-work queues.

## The shared cockpit contract

The HTML is deterministic and self-contained. Stable sections expose
`data-contract="agent-start"`, `human-attention`, `next-work`, `delivery-trunk`, `truth-map`, and
`commands`. The full machine state is embedded as JSON in `#project-os-state`. Agents should
prefer `project-os onboard --json`; humans can read the same projection visually.

Neither surface writes project state. All mutations still pass through the canonical records and
CLI lifecycle gates.
