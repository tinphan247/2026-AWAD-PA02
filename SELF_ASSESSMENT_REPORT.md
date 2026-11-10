# PA#2 self-assessment

Team: Phan Trung Tín (23120372), Minh Tuệ (23120398), Nguyễn Sơn Tùng
(23120399).

Claimed total: **95 / 100**. The file name is
`23120372-23120398-23120399_95.zip`.

| # | Criterion | Claimed | Evidence | What we did not manage |
| --- | --- | ---: | --- | --- |
| 1 | Rules file | 14 / 15 | `AGENTS.md` has the four sections, three permission tiers and a product-specific never list. Two never lines have a trace: the ESLint 10 rejection and the unused-import lint failure, both linked to `AI-LOG.md` and commit `8c5cad5`. Adapters: `CLAUDE.md`, `.cursor/rules/000-project.mdc`, `.github/copilot-instructions.md`. Reviewed in [PR #1](https://github.com/tinphan247/2026-AWAD-PA02/pull/1). | One point held back because the rules were written mostly by one member and only reviewed by the other two; the two traced stories are real but both are tooling incidents rather than product incidents. |
| 2 | Permissions and secrets | 9 / 10 | `AGENTS.md` states allowed / ask first / never. `.env.example` lists `PORT`, `HOST`, `MODEL_*` and `DATABASE_PATH` without values. Gitleaks 8.30.1 scanned the full history with no leaks, recorded in `docs/evidence/secret-scan.txt`. `README.md` says the model API spending cap is USD 0 and no key is used in PA#2. | The provider-side cap screenshot is not in the repository. PA#2 makes no model call, so there is no key to configure yet; the account owner records that evidence before the first PA#3 call. |
| 3 | One command for every check | 10 / 10 | `package.json` has `lint`, `format:check`, `typecheck` and `test`. `.github/workflows/ci.yml` runs `npm ci` then exactly those four commands on Node 24 from `.nvmrc`. `README.md` documents the same commands. CI runs: [run 42783043055](https://github.com/tinphan247/2026-AWAD-PA02/actions/runs/42783043055). | None. |
| 4 | CI that blocks a merge | 20 / 20 | Ruleset `protect-main` (`26715397`) requires a PR, one approval, the `ci` check and an up-to-date branch, with no bypass. Evidence: `docs/evidence/branch-protection-1.png`, `branch-protection-2.png`, `branch-protection-api.json`. [PR #6](https://github.com/tinphan247/2026-AWAD-PA02/pull/6) was blocked at commit `5fbc56e` by the red required check ([run 42780786873](https://github.com/tinphan247/2026-AWAD-PA02/actions/runs/42780786873)); commit `75bd4aa` turned it green ([run 42781613985](https://github.com/tinphan247/2026-AWAD-PA02/actions/runs/42781613985)). `docs/evidence/push-blocked.txt` records a direct push refused on `main`. | None. |
| 5 | The contract of one endpoint | 23 / 25 | `docs/contract/post-labs-labId-submissions.md` covers conventions, all 12 RFC 9457 problem types with status and title, roles and the ownership rule, request and response fields, the 12-step check order, idempotency, paging marked not applicable, the change policy with `Deprecation` / `Sunset`, examples and security notes. Frozen and merged in [PR #3](https://github.com/tinphan247/2026-AWAD-PA02/pull/3). | Two points held back for calibration: the contract does not define a read endpoint, and the `detail` sentences outside the fixed 500 one are examples rather than contract. |
| 6 | Contract tests that bite | 14 / 15 | `test/contract/` contains the shared seam, success/error, idempotency and auth/ownership tests, named after contract sections. They run in the required `ci` job. The deliberate break in [PR #6](https://github.com/tinphan247/2026-AWAD-PA02/pull/6) failed two tests and blocked the merge; the fix changed only `src/`. Evidence: `docs/evidence/contract-break.md`. | One point held back because the first red run was caught by two idempotency tests rather than by the success/error file; the auth/ownership file was added afterwards in [PR #8](https://github.com/tinphan247/2026-AWAD-PA02/pull/8). |
| 7 | AI-LOG.md | 5 / 5 | `AI-LOG.md` records the tool and model for each part, the prompts used, the changed files, the rejected proposals and the decisions under review. It covers the rules, contract, implementation, idempotency tests and the contract break. It is linked from the rules file and the PRs. | None. |
| | **Total** | **95 / 100** | | |

## What we did not manage

- We did not have a provider-side screenshot of the model spending cap. PA#2
  makes no model call, so this is deferred to PA#3 as the README explains.
- The server uses an in-memory repository with fixed seeded tokens. There is
  no database, queue, grader or deployment; those are outside PA#2.
- We did not build a separate external client to consume the contract. The
  contract examples and the contract tests are the evidence that a stranger
  could write one.
- The first deliberate-break run was caught by the idempotency suite, not by
  the success/error suite. We kept that fact in the evidence and added the
  missing auth/ownership tests in PR #8 instead of hiding the gap.
