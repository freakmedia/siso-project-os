# Optional adapters

Adapters can produce design studies or assets, but they are not part of the core state machine and never approve a direction.

Each configured adapter needs:

1. A capability manifest based on `_templates/adapter-capability.json`.
2. A receipt for every invocation based on `_templates/adapter-receipt.json`.
3. Repository-relative output paths under the owning campaign.

The capability manifest describes inputs, outputs, availability, credential mode, and whether output begins as `study_only`. The receipt freezes the exact prompt or instruction, input hashes, output paths, timestamps, and result status.

Do not store secrets, session tokens, SDK caches, or provider-specific runtime code here. Credentials remain external. If an adapter is unavailable, the campaign continues with authored artifacts.
