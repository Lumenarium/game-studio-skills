# Creative setup and separate production flows

[The batch manifest](relic-signal.batch.json) contains all five supported asset families: Character, Prop,
static Background, UI Icon and UI Surface. Replace model placeholders using eligible product discovery.
Each entry stops for explicit review; no example authorizes live spend or candidate selection.

Moodboard and Style Preview use separate shared contracts and separate commands, never an asset-family cast:

```sh
game-studio generation context --project PROJECT_ID --input context.json --json --endpoint https://studio.lumenarium.biz
game-studio model list --project PROJECT_ID --input models.json --json --endpoint https://studio.lumenarium.biz
game-studio moodboard submit --project PROJECT_ID --input moodboard.json --idempotency-key moodboard-v1 --json --endpoint https://studio.lumenarium.biz
game-studio style-preview submit --project PROJECT_ID --input style-preview.json --idempotency-key style-preview-v1 --json --endpoint https://studio.lumenarium.biz
game-studio generation retry --project PROJECT_ID --job JOB_ID --idempotency-key retry-v1 --json --endpoint https://studio.lumenarium.biz
game-studio generation clone --project PROJECT_ID --job JOB_ID --idempotency-key clone-v1 --json --endpoint https://studio.lumenarium.biz
game-studio generation continue --project PROJECT_ID --job JOB_ID --input continue.json --idempotency-key continue-v1 --json --endpoint https://studio.lumenarium.biz
game-studio candidate get --project PROJECT_ID --job JOB_ID --candidate CANDIDATE_ID --json --endpoint https://studio.lumenarium.biz
```

Use full-command help for the actual input schemas. Preserve explicit selectedReferenceIds and the reviewed
context fingerprint; `[]` means no Project references. Style Preview names a retained technique reference.
Inspect diagnostics and output IDs before export. Failed processing has no accepted output to export.
