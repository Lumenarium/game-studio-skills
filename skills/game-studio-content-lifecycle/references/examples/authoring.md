# Linked authoring examples

Prepare strict JSON using each full-command `--help` input example and current server revisions. These are
independent examples, not a script to execute wholesale. Retry an ambiguous command with the original key;
read current detail after a stale-revision conflict, preserve the draft, then prepare a new intent.

```sh
game-studio project concept set --project PROJECT_ID --file concept.json --idempotency-key concept-v1 --json
game-studio character set --project PROJECT_ID --character CHARACTER_ID --input character.json --idempotency-key character-v1 --json
game-studio mechanic create --project PROJECT_ID --input mechanic.json --idempotency-key mechanic-v1 --json
game-studio narrative set --project PROJECT_ID --input outline.json --idempotency-key outline-v1 --json
game-studio scene set --project PROJECT_ID --scene SCENE_ID --input scene.json --idempotency-key scene-v1 --json
game-studio quest set --project PROJECT_ID --quest QUEST_ID --input quest.json --idempotency-key quest-v1 --json
game-studio catalog import preview --project PROJECT_ID --input import-preview.json --json
game-studio catalog import commit --project PROJECT_ID --input import-commit.json --idempotency-key import-v1 --json
game-studio catalog graphics bind --project PROJECT_ID --slot SLOT_ID --input pin.json --idempotency-key pin-v1 --json
game-studio catalog graphics download --project PROJECT_ID --slot SLOT_ID --output-root out --image pinned.png --metadata pinned.json --json
game-studio document sources --project PROJECT_ID --kind concept --json
game-studio document set --project PROJECT_ID --document DOCUMENT_ID --input document.json --idempotency-key document-v1 --json
game-studio document review --project PROJECT_ID --document DOCUMENT_ID --input review.json --idempotency-key review-v1 --json
game-studio document export create --project PROJECT_ID --document DOCUMENT_ID --input export.json --idempotency-key export-v1 --json
game-studio document export download --project PROJECT_ID --document DOCUMENT_ID --export EXPORT_ID --output-root out --markdown design.md --manifest design.manifest.json --metadata design.files.json --json
```

Keep complete selected manifests and canonical external keys. Unknown selection keys are errors; review
dependency closure and copy the returned preview token into commit. Pins include asset/revision/checksum.
Supported document source kinds are Concept, Character, Mechanic, Quest and Scene; catalog art is an explicit
file/pin, not an invented document source. Copy the displayed fingerprint when explicitly reviewing drift.
Immutable exports preserve both rendered Markdown and manifest; changing source state cannot rewrite them.
