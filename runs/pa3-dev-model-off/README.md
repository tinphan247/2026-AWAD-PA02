# Dev run, model off (PA#3, criterion 6)

The checker on the published dev set with the semantic model switched off, so
the hard rules (criterion 3) decide every ban-list pair and nothing else.

## How it was made

Checker at commit `dde8876`, built and run in its image with the network cut:

```bash
docker build -f Dockerfile.checker -t leetkob-checker .
docker run --rm --network none --memory 1g --pids-limit 256 \
  -v "$PWD/leetkob-eval:/data:ro" -v "$PWD/runs/pa3-dev-model-off:/out" \
  -e MODEL_OFF=1 leetkob-checker --dataset /data --out /out/predictions.jsonl
node leetkob-eval/eval.mjs --data leetkob-eval \
  --predictions runs/pa3-dev-model-off/predictions.jsonl \
  --json runs/pa3-dev-model-off/summary.json > runs/pa3-dev-model-off/eval-report.txt
```

`eval.mjs` was run in a `node:24-alpine` container so the report shows
`/repo/...` paths and not a team member's local folders.

## Files

| File | Content |
|---|---|
| `predictions.jsonl` | 102 predictions, the checker's output |
| `decisions.jsonl` | who decided each pair (`hard_rule` / `model_off`) and `model_called` (always `false` here) |
| `eval-report.txt` | `eval.mjs` output, unchanged |
| `summary.json` | `eval.mjs --json` output, unchanged |

## Result: FAIL, as expected with the model off

| Metric | All 102 pairs | 55 ban-list pairs (hard rules) | Target |
|---|---|---|---|
| Wrongful deductions | **0** | **0** | = 0 |
| Recall | 40.5% (15/37) | **100% (15/15)** | ≥ 90% |
| Unsure rate | 46.1% (47/102) | **0% (0/55)** | ≤ 20% |

The 47 semantic pairs are `unsure` because the model is off, and the 22
violations among them are therefore not caught. That is the whole FAIL. The
dev run with the model (`runs/pa3-dev/`, with `calls.jsonl`) follows once the
model client (criterion 4) is wired into the checker.
