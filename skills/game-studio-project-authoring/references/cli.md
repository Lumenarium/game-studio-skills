# Lumenarium Studio CLI for installed skills

Run `npx @lumenarium/game-studio-skills@latest setup` in the game project to install the CLI and skills.
The user fills in `GAME_STUDIO_TOKEN=`; never ask them to paste the token into chat.
For this project-local installation, substitute `npx --no-install game-studio` for `game-studio`
in all examples. The service ZIP contains only skills; its CLI prerequisite is the same npm package.
Run commands from the game repository and respect its `AGENTS.md`.

## Connection and command discovery

Read full-command help before preparing inputs:

```sh
game-studio --help --json
game-studio project create --help --json
```

The user provisions only `GAME_STUDIO_TOKEN` in the game project's gitignored `.env` or authorized environment.
The CLI reads the working directory's `.env` automatically; explicit environment credentials take precedence.
An explicitly configured `--token-stdin` is also supported. Never put tokens in arguments, input files,
logs, chat, skills or committed scripts. Tokens are scoped to one Studio and expire within 90 days.

```sh
game-studio auth whoami --json
game-studio project list --studio STUDIO_ID --json
```

Confirm the intended Studio before mutation. Scopes intersect with current project access;
a token cannot grant access the user lacks. Administration, tokens, provider keys and model
enablement remain outside this CLI. Never forward credentials to storage URLs.

## Inputs and results

Full-command help defines flags, scopes and strict JSON examples. Use `--input` for ordinary JSON,
`--file` for Concept/Art Settings and stable `--idempotency-key` values where required. After an
ambiguous response, repeat the same command, input and key. Follow list cursors until `nextCursor`
is null. Refresh a stale revision before making a deliberately new change.

Use `--json` for a final envelope or `--ndjson` for events. Exit codes: 0 success, 2 invalid input/config,
3 authorization, 4 conflict/not-ready, 5 transient failure, 6 partial completion. Submission is not completion.

## Included examples

- [Project authoring](examples/authoring.md)
- [Creative setup and generation](examples/creative.md)
- [Graphics editing and export](examples/graphics.md)
- [Content lifecycle](examples/lifecycle.md)
- [Batch guide](examples/README.md) and [synthetic manifest](examples/relic-signal.batch.json)

Paths in examples are relative to the game repository. Copy the needed examples there, prepare strict
input files and create output directories. Replace placeholder IDs with authorized identities.
Do not execute all examples as one script. The examples grant no provider-spend permission.

Each generation specifies `selectedReferenceIds` explicitly. Inspect `generation context`, preserve
its fingerprint and refresh context only for a deliberately new submission. Upload, approval, technique
selection and inclusion in generation are separate user decisions.

## Review, recovery and files

Obtain explicit permission naming the batch, models and spend limit before paid generation. The CLI
limits concurrency, not money. Each batch entry pauses for candidate review. Inspect the image and
select the exact candidate explicitly; model order or first success never implies acceptance.

Keep receipts intact when resuming. The API is authoritative. Use an existing output root and confined
relative paths; never overwrite unrelated files or allow traversal/symlink escape. Downloads verify size,
MIME and checksum before publication. Do not persist signed URLs or object keys. Export accepted revisions;
saving a revision does not accept it.

Trash, restore and purge require exact identities and current scopes. Purge needs separate user intent
and `--confirm` equal to the target ID. Dependencies can block deletion. Only `purged` with `completedAt`
proves completion; scheduled work or a missing entity does not.
