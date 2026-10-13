---
name: game-studio-content-lifecycle
description: Inspect Game Studio retained content and recover exact-target trash, restore and purge operations through the public CLI.
---

# Content lifecycle

Administration and token/credential management are excluded from this CLI workflow.

The npm package `@lumenarium/game-studio-skills` includes the CLI. Run all examples from the game project,
using `npx --no-install game-studio` in place of the bare `game-studio` prefix for a local npm installation.
The user runs `npx @lumenarium/game-studio-skills@latest setup` and fills `GAME_STUDIO_TOKEN=` in the project’s gitignored
`.env`; the CLI reads it automatically. Explicit environment credentials or `--token-stdin` override the file.
Never read or print the token yourself; let the CLI load it.

Read `AGENTS.md` and preserve unrelated data. Use `GAME_STUDIO_TOKEN`
from an authorized environment or `--token-stdin`. Never use private API routes, browser cookies,
direct database/storage access or MCP-specific mechanisms. Never persist signed URLs or private object keys.
Reject traversal and symlink escape. Provider work is unsupported here; it requires separate explicit
authorization and a spend limit. Lifecycle commands must not submit generation or delete dependencies.

Read [lifecycle examples](references/examples/lifecycle.md). Choose the exact `reference`, `asset` or
`tileset` family. `all` is only for listing and needs both reference-read and asset-read scopes. Dependency
details require their own domain read scopes. Do not interpret hidden details as zero dependencies.

```sh
game-studio content trash-list --project PROJECT_ID --family all --limit 100 --json
game-studio content status --project PROJECT_ID --family asset --content CONTENT_ID --json
game-studio content trash --project PROJECT_ID --family asset --content CONTENT_ID --idempotency-key trash-v1 --json
game-studio content restore --project PROJECT_ID --family asset --content CONTENT_ID --idempotency-key restore-v1 --json
```

Reusing a key returns the original result without undoing a later operation. A 503 can mean the transition
committed but purge scheduling is pending: retry the same command key and inspect status. Restore keeps a
reference unapproved. Explicit purge needs user intent and `--confirm` equal to the exact content ID; it
does not cascade through retained dependencies. Accepted/scheduled is not completed. Only `state: purged`
with a durable `completedAt` proves completion; 404 alone proves nothing. Project purge remains scheduled,
with no invented manual Project purge command. Authoring archive/restore uses its domain revision contract.
