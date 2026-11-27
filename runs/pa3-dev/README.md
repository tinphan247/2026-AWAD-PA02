# Dev run with the real model (PA#3, criteria 4 and 6)

One run of the checker on the published dev set (`leetkob-eval/`, unchanged)
with a real model. Nothing in this folder was edited by hand: the predictions,
decisions and call log are the checker's output, and `eval-report.txt` and
`summary.json` are the output of the published `eval.mjs`.

## How it was made

| Item | Value |
|---|---|
| Checker | commit `b23e078` (`tung/checker-rate-limit`, PR #22: pacing and retry on HTTP 429) |
| Model | `gemini-3.1-flash-lite`, Google AI Studio, free tier (spending cap USD 0) |
| Where | VM `leetkob-worker`, 27 Nov 2026, 10:24–10:31 UTC |
| Command | `node bin/check.mjs --dataset leetkob-eval --out runs/pa3-dev/predictions.jsonl` with `MODEL_NAME`, the key and the pacing flags set in the environment (the key is not stored anywhere in this repository) |
| Scoring | `node leetkob-eval/eval.mjs --data leetkob-eval --predictions runs/pa3-dev/predictions.jsonl --json runs/pa3-dev/summary.json > runs/pa3-dev/eval-report.txt` |

`eval.mjs` and `labels.jsonl` are byte for byte the published copies
(`leetkob-eval.sha256`, `eval.mjs` starts `c836edd8713521bb`). The scoring was
repeated on the committed files and gave the same numbers as on the VM. The
`eval-report.txt` header shows the path of the sandbox where it was re-run.

## Files

| File | Content |
|---|---|
| `predictions.jsonl` | 102 predictions, one per (solution, constraint) |
| `decisions.jsonl` | who decided each pair: 55 `hard_rule` (`model_called: false`), 47 `model` |
| `calls.jsonl` | one line per model reply: provider request id, model, tokens in/out, latency, cost and the prompt actually sent (code with comments and identity removed) |
| `eval-report.txt` | `eval.mjs` output |
| `summary.json` | `eval.mjs --json` output |

## Result: FAIL (PA#3 has no pass mark; the thresholds count from PA#4)

| Metric | Result | Target |
|---|---|---|
| Wrongful deductions | **3** | = 0 |
| Recall | **64.9%** (24/37) | ≥ 90% |
| Unsure rate | 17.6% (18/102) | ≤ 20% |

The three wrongful deductions are `dynamic-array/s04 C3`,
`reverse-words/s02 C2` and `reverse-words/s04 C2`: the model returned
`violation` with an evidence line that does match the code, but the label says
the solution complies. They are model misjudgements, not a hard-rule error:
the 55 ban-list pairs were decided by the hard rules without a model call and
have no wrongful deduction.

The 13 missed violations all ended as `unsure`, none as `pass`.

Calls: 47 semantic pairs were sent to the model, but `calls.jsonl` has 36
lines, because a call that fails or times out is not logged (it has no
provider reply and no request id) and its pair becomes `unsure`. So 11 of the
18 `unsure` pairs are most likely failed calls (free-tier rate limit or
provider overload), and 7 are `unsure` verdicts the model gave. The decision
log does not record the reason per pair, so this split is inferred from the
counts, not read from a log.

## Cost

Tokens in the 36 logged replies: 23,581 in and 4,129 out, so on average 655 in
and 115 out per call. The `costUsd` field sums to **USD 0.0174** (USD 0.000483
per call).

`src/model/cost.js` has no price for `gemini-3.1-flash-lite`, so it falls back
to the `gemini-2.5-flash` price (USD 0.30 per million tokens in, USD 2.50 per
million out). The figure is therefore a deliberate over-estimate for the lite
model. The tokens were billed to a free-tier key, so the real charge was
USD 0.

One lab of 80 submissions, with one semantic constraint per submission as in
the dev set (47 semantic pairs for 47 solutions):

```text
80 calls x 0.000483 USD = about 0.039 USD per lab   (fallback price)
```

Even with two semantic constraints per submission, it stays under USD 0.08 per
lab.
