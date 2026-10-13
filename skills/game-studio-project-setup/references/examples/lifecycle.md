# Lifecycle examples

Inspect status/dependencies before requesting a destructive transition. Choose only the action authorized by
the user. Do not run trash/restore/purge examples as one sequence. Same-key replay returns original state;
read status to see the current cycle. Reference restore never silently approves a reference.

```sh
game-studio character archive --project PROJECT_ID --character CHARACTER_ID --input lifecycle.json --idempotency-key archive-v1 --json --endpoint https://studio.lumenarium.biz
game-studio character restore --project PROJECT_ID --character CHARACTER_ID --input lifecycle.json --idempotency-key restore-v1 --json --endpoint https://studio.lumenarium.biz
game-studio content status --project PROJECT_ID --family reference --content CONTENT_ID --json --endpoint https://studio.lumenarium.biz
game-studio content purge --project PROJECT_ID --family reference --content CONTENT_ID --confirm CONTENT_ID --idempotency-key purge-v1 --json --endpoint https://studio.lumenarium.biz
```

Missing/mismatched confirmation is rejected locally. Dependency conflict never authorizes cascading deletion.
Keep the key after a lost response. Retry pending dispatch rather than resetting retention or creating another
purge cycle. A durable completed timestamp is the completion evidence; a missing entity is not.
