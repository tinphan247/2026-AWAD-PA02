# PA#3 self-assessment

Team: Phan Trung Tín (23120372), Minh Tuệ (23120398), Nguyễn Sơn Tùng
(23120399).

Repository: https://github.com/tinphan247/2026-AWAD-PA02

Claimed total: **90 / 100**. The file name is
`23120372-23120398-23120399_90.zip`. The PA#2 report is kept in
[`docs/SELF_ASSESSMENT_PA2.md`](docs/SELF_ASSESSMENT_PA2.md).

| # | Criterion | Max | Self-score | Evidence |
| - | --------- | --: | ---------: | -------- |
| 1 | The flow, end to end, on your deployment | 15 | 14 | Public deployment <https://two026-awad-pa02.onrender.com/> with the accounts in [`PA3.md`](PA3.md). A TA creates the lab through the UI ([`test/web/flow.test.js`](test/web/flow.test.js) covers create, submit, review and the class isolation of the status 403), students submit, the worker judges through the Postgres queue, and the review queue shows verdict, evidence and the TA's deduction ([`src/domain/review.js`](src/domain/review.js)). The walk-through is recorded ([video](https://drive.google.com/file/d/1cf2famtwMWCDJZ-A-vUSR-VqzKmfeh4O/view), lab #5): one compliant, one `std::sort` and one injection submission, the TA decides each constraint, and a TA of the other class gets 403. |
| 2 | Queue and sandbox | 20 | 19 | Nine attack submissions in [`test/sandbox/attacks`](test/sandbox/attacks) (network, CPU, wall clock, memory read back, processes, output, non-root, host mounts and Docker socket, secrets), run by the `sandbox` job in [`ci.yml`](.github/workflows/ci.yml) ([PR #15](https://github.com/tinphan247/2026-AWAD-PA02/pull/15)). Compiling runs inside the sandbox. The queue claims jobs with a lease and [`test/queue/exactly-once.test.js`](test/queue/exactly-once.test.js) proves a submission is judged once after the worker stops and starts ([PR #14](https://github.com/tinphan247/2026-AWAD-PA02/pull/14)). The CI run for the `pa3` tag is green for both jobs: [run #46001759926](https://github.com/tinphan247/2026-AWAD-PA02/actions/runs/46001759926). |
| 3 | Hard rules first | 15 | 14 | Syntax-aware ban-list check with tree-sitter ([PR #16](https://github.com/tinphan247/2026-AWAD-PA02/pull/16), [`test/hard-rules`](test/hard-rules)): the traps (own `sort` in a namespace, a banned name in a comment or string, `<algorithm>` for `std::swap`) do not fire. The model-off run [`runs/pa3-dev-model-off/`](runs/pa3-dev-model-off/) has 0 wrongful deductions and decides all 55 ban-list pairs with no model call; the real-model run records `model_called: false` for the same 55 pairs ([`runs/pa3-dev/decisions.jsonl`](runs/pa3-dev/decisions.jsonl)). |
| 4 | The model judges the semantic constraints | 20 | 18 | One real run is committed in [`runs/pa3-dev/`](runs/pa3-dev/) ([PR #23](https://github.com/tinphan247/2026-AWAD-PA02/pull/23)): `gemini-3.1-flash-lite`, 36 logged replies, every line with the provider request id, tokens, latency, cost and the prompt actually sent (comments and identity removed; [`src/model/prompt.js`](src/model/prompt.js), [`test/unit/model-anonymize.test.js`](test/unit/model-anonymize.test.js)). The model returns pass, violation or unsure with evidence and nothing that sets a deduction. [README](README.md#model-and-cost-pa3) and [`PA3.md`](PA3.md) name the model and the cost of one lab of 80 submissions with the arithmetic (about USD 0.039). Not 20 because the cost uses the `gemini-2.5-flash` fallback price and 11 of the 47 model calls failed and left no log line; the deployed worker now uses `gemini-3.1-flash-lite` with `MODEL_TIMEOUT_MS=30000` and logged 3 calls (2,079 tokens in, 408 out) on lab #2. |
| 5 | First limits, and the review queue | 10 | 9 | A reply that fails the schema becomes `unsure` (`schema_invalid`) and a timeout becomes `unsure` (`timeout`), both tested with a fake model and no network in [`test/unit/model-judge.test.js`](test/unit/model-judge.test.js). Verdicts land only in the TA's review queue; no Publish action exists in this build, and the student page says the verdict is not published ([`src/web/routes.js`](src/web/routes.js), FAQ-08). Cost cap per lab and `compile_error` skip are tested in [`test/judge/pipeline.test.js`](test/judge/pipeline.test.js) ([PR #19](https://github.com/tinphan247/2026-AWAD-PA02/pull/19)). |
| 6 | The checker command and a first eval | 10 | 9 | [README](README.md#checker-command-pa3-criterion-6) gives the command, [`Dockerfile.checker`](Dockerfile.checker) and `MODEL_OFF=1` ([PR #17](https://github.com/tinphan247/2026-AWAD-PA02/pull/17)); the model-off run is in `runs/pa3-dev-model-off/`. The dev set is byte for byte the published copy ([`leetkob-eval.sha256`](leetkob-eval.sha256)); our own cases are in [`leetkob-eval-extra`](leetkob-eval-extra). The real-model run was re-scored with the published `eval.mjs` and gave the same numbers as on the VM: **FAIL**, 3 wrongful deductions, recall 64.9% (24/37), unsure 17.6%. PA#3 has no pass mark; the numbers are reported as they are. |
| 7 | Tests first, one part per commit | 5 | 3 | Parts landed in separate PRs (queue #14, sandbox #15, hard rules #16, checker #17, model and UI #18, compile-error skip #19, model wiring #20). Tests were committed before code for the compile-error skip ([PR #19](https://github.com/tinphan247/2026-AWAD-PA02/pull/19)) and for the rate-limit pacing ([PR #22](https://github.com/tinphan247/2026-AWAD-PA02/pull/22)). Claimed 3 because PR #18 combines the model, the UI and the worker in one branch, and we have not checked every part's commit order. |
| 8 | AI-LOG.md | 5 | 4 | [`AI-LOG.md`](AI-LOG.md) has an entry per session for PA#3 with tool and model and real Changed / Rejected items (for example the 2.5-flash model rejected after it was closed to new keys, the global spend cap dropped, and the Gemini CLI route rejected for the call log). Claimed 4 because not every member's entries for the last days are in yet. |
|   | **Total** | **100** | **90** | |

The total is 90 and the zip is `23120372-23120398-23120399_90.zip`; the two
numbers must stay equal. Every row above cites evidence that exists in the
repository or on the deployment.

## What we did not manage

- **The dev run fails the PA#4 thresholds.** 3 wrongful deductions (all model
  misjudgements, none from the hard rules), recall 64.9%, unsure 17.6%. The
  prompts were not tuned on the dev set, to avoid fitting to it; this is a
  first run.
- **Free-tier limits shaped the run.** `gemini-2.5-flash` was closed to new
  keys and the older project's daily quota ran out, so the run used
  `gemini-3.1-flash-lite`. Of 47 model calls, 36 came back; the other 11 are
  most likely errors or timeouts and became `unsure`. The decision log does not
  say why per pair, so that split is inferred.
- **Cost is an over-estimate.** `src/model/cost.js` has no entry for the lite
  model, so it uses the `gemini-2.5-flash` price. The free tier was not billed.
- **Latency of the free-tier model.** `gemini-3.1-flash-lite` takes about 17 s
  per call, so the deployed worker needs `MODEL_TIMEOUT_MS=30000`. The first demo
  run at 20 s timed out and produced `unsure`; the resubmission passed.
- **No provider-side spending-cap screenshot in the repository.** The key is on
  the free tier with no billing enabled, but we have no screenshot of it.
