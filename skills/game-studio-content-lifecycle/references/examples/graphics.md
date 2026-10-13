# Graphics examples

Use the schemas and examples in full-command help. The output root must exist. Each output path must be
distinct, relative and free of symlinks. `saveId` and parent IDs live in the input file, not a second competing
idempotency flag. Raster inputs pin a SHA-256. Native save inputs name a local document with every cell path.

```sh
game-studio asset revision upload --project PROJECT_ID --asset ASSET_ID --input raster-save.json --json --endpoint https://studio.lumenarium.biz
game-studio surface geometry set --project PROJECT_ID --asset ASSET_ID --revision REVISION_ID --input geometry.json --idempotency-key geometry-v1 --json --endpoint https://studio.lumenarium.biz
game-studio indicator sources --project PROJECT_ID --offset 0 --json --endpoint https://studio.lumenarium.biz
game-studio indicator create --project PROJECT_ID --input indicator.json --idempotency-key indicator-v1 --json --endpoint https://studio.lumenarium.biz
game-studio indicator edit --project PROJECT_ID --asset ASSET_ID --revision REVISION_ID --input indicator-edit.json --idempotency-key indicator-edit-v1 --json --endpoint https://studio.lumenarium.biz
game-studio indicator duplicate --project PROJECT_ID --asset ASSET_ID --revision REVISION_ID --input duplicate.json --idempotency-key duplicate-v1 --json --endpoint https://studio.lumenarium.biz
game-studio indicator preview --project PROJECT_ID --asset ASSET_ID --revision REVISION_ID --input value.json --output-root out --image value.png --json --endpoint https://studio.lumenarium.biz
game-studio indicator export --project PROJECT_ID --asset ASSET_ID --output-root out --manifest indicator.json --json --endpoint https://studio.lumenarium.biz
game-studio tileset detect --project PROJECT_ID --reference REFERENCE_ID --json --endpoint https://studio.lumenarium.biz
game-studio tileset create --project PROJECT_ID --input grid.json --idempotency-key tileset-v1 --json --endpoint https://studio.lumenarium.biz
game-studio tileset export --project PROJECT_ID --tileset TILESET_ID --output-root out --image atlas.png --metadata atlas.json --json --endpoint https://studio.lumenarium.biz
```

Explicit `asset accept` selects a saved revision. Indicator export retains exact layer pins and optional icon
placement; `--background scene.png` only affects a local preview. The atlas keeps all grid positions, including
duplicate tiles and their `duplicateOfIndex` mapping. Failed slicing publishes no partially ready tileset.
