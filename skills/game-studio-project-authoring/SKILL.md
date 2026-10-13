---
name: game-studio-project-authoring
description: Author linked game content with Game Studio public CLI revision guards and replay receipts.
---

# Project authoring

Administration and token/credential management are excluded from this CLI workflow.

The service endpoint is fixed: `https://studio.lumenarium.biz`. Set
`GAME_STUDIO_ENDPOINT=https://studio.lumenarium.biz` and pass
`--endpoint https://studio.lumenarium.biz` on every remote command.

The npm package `@lumenarium/game-studio-skills` includes the CLI. Run all examples from the game project,
using `npx --no-install game-studio` in place of the bare `game-studio` prefix for a local npm installation.
The user runs `npx @lumenarium/game-studio-skills@latest setup` and fills `GAME_STUDIO_TOKEN=` in the project’s gitignored
`.env`; the CLI reads it automatically. Explicit environment credentials or `--token-stdin` override the file.
Never read or print the token yourself; let the CLI load it.

Read the repository's `AGENTS.md`; preserve its dirty worktree. Use `GAME_STUDIO_ENDPOINT` and
`GAME_STUDIO_TOKEN` from an authorized environment or `--token-stdin`. Never use private API routes,
browser cookies, direct database/storage access or MCP-specific mechanisms. Do not persist signed URLs,
private object keys or credentials. Files must remain confined: no traversal or symlink escape.
Provider calls require explicit authorization and a spend limit; authoring itself creates no provider jobs.
Report unsupported operations rather than substituting another family.

Read [authoring examples](references/examples/authoring.md) and [CLI operations](references/cli.md).
Use exact Project/entity IDs returned by commands. Preserve field text and stable child IDs. Read the current
revision before preparing an atomic replace; a 409 leaves the local input untouched. Reconcile current detail
before a new intent. Retry ambiguous responses with the identical input and original key: replay returns the
original result, not a later edit. Revoked membership, archived Projects and foreign source IDs remain denied.

```sh
game-studio project get --project PROJECT_ID --json --endpoint https://studio.lumenarium.biz
game-studio character list --project PROJECT_ID --limit 100 --json --endpoint https://studio.lumenarium.biz
game-studio character list --project PROJECT_ID --graphics --json --endpoint https://studio.lumenarium.biz
game-studio character get --project PROJECT_ID --character CHARACTER_ID --graphics --json --endpoint https://studio.lumenarium.biz
game-studio mechanic list --project PROJECT_ID --limit 100 --json --endpoint https://studio.lumenarium.biz
game-studio narrative get --project PROJECT_ID --json --endpoint https://studio.lumenarium.biz
game-studio quest list --project PROJECT_ID --json --endpoint https://studio.lumenarium.biz
game-studio document list --project PROJECT_ID --json --endpoint https://studio.lumenarium.biz
```

Follow `nextCursor` until null; never infer completion from the first page. Review import selection and its
preview token before commit. A planning slot is not generated art: bind an explicit compatible accepted pin.
Source review is explicit; exports retain their original bytes after source edits. External links are stored
metadata and must never be automatically fetched. Archive/restore retains identity; consult
[content lifecycle](../game-studio-content-lifecycle/SKILL.md) for graphics trash and purge.
