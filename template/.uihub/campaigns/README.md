# Campaigns

Create one `UI-####/` directory per design campaign. Its `campaign.json` must include the ID of an existing canonical `.agents/tasks` task.

Campaigns may outlive a sprint because they preserve intent, alternatives, human decisions, implementation receipts, and proof. They do not own backlog status or redefine task completion.

Use `_templates/campaign.json` as the initial record and copy the remaining templates into the matching stage directories as work advances. Static review pages and JSON reviewer responses belong in `review/`; product edits do not.

Never mutate a past decision to make a later result look inevitable. If a new campaign replaces this one, advance the old campaign to `superseded`, record the reason and replacement ID, and leave its artifacts intact.
