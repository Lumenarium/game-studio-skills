# Provider-free manifest example

`relic-signal.batch.json` is a synthetic, hand-authored `game-studio-batch/v3` example. It creates a minimal
Project and a named Character, then binds the Character generation entry through `characterRef` before the
explicit revision-zero Art setup and production entries. The Character profile belongs only in its setup
definition, never in the entry or persisted receipt.
Validate without credentials or remote calls:

```sh
game-studio batch validate --manifest examples/automation/relic-signal.batch.json --json
```

Replace the Project identity deliberately and check model eligibility before an explicitly authorized live run.
The example does not authorize provider spend and contains no generated artwork or downloaded models.
Each entry explicitly selects `[]`: no Project references. Replace this with approved canonical reference IDs
when desired. The runner previews the exact selection and checkpoints its context fingerprint before submit;
changed context requires a deliberate new command, never an automatic selection fallback.

| Inventory | Treatment |
|---|---|
| Keeper | character |
| Copper relic | prop |
| Static workshop screen | background |
| Pouch symbol | ui-icon |
| Spark VFX / animation | unsupported |
| Excavation sheet | unsupported |
| Contamination overlay | unsupported |
| Scrolling background | unsupported |

Unsupported inventory stays outside the production manifest; adding it as a fake prop is prohibited.
