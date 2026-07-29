# Live resume briefs

This directory is deliberately narrow:

- `CURRENT.md` is the one live resume pointer.
- `snapshots/` holds immutable lead-state snapshots created at meaningful transitions.

Worker packets do not live here; they belong to the run that dispatched them. Durable technical
facts do not live here either; promote them to `../memory/` or project documentation.

Keep `CURRENT.md` concise. It should point to canonical tasks, sprints, runs, decisions, and
evidence rather than copying their contents. Never append superseded history to it indefinitely.
