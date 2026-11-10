# PA#2 — Harness and quality gate

CSC13114 · LeeTKOB · team of 3.

| Student | ID | Role |
| --- | --- | --- |
| Phan Trung Tín | 23120372 | gate and release lead |
| Nguyễn Sơn Tùng | 23120399 | rules, security and AI log lead |
| Minh Tuệ | 23120398 | contract and contract tests lead |

The endpoint under contract is `POST /v1/labs/{labId}/submissions`. Its
specification is [`docs/contract/post-labs-labId-submissions.md`](docs/contract/post-labs-labId-submissions.md);
the implementation is in `src/` and the tests in `test/contract/`.

## Required links

1. **Repository:** <https://github.com/tinphan247/2026-AWAD-PA02>
2. **Protected-branch settings:** the required `ci` check, one approval, strict
   up-to-date branch, no bypass, no force push and no deletion are captured in
   [`docs/evidence/branch-protection-1.png`](docs/evidence/branch-protection-1.png),
   [`docs/evidence/branch-protection-2.png`](docs/evidence/branch-protection-2.png)
   and the API capture
   [`docs/evidence/branch-protection-api.json`](docs/evidence/branch-protection-api.json).
   The live ruleset is <https://github.com/tinphan247/2026-AWAD-PA02/rules/26715397>.
3. **Blocked PR:** [PR #6](https://github.com/tinphan247/2026-AWAD-PA02/pull/6)
   at commit
   [`5fbc56e`](https://github.com/tinphan247/2026-AWAD-PA02/commit/5fbc56e7ee3ac7aaad63a2ac3eee2cf8723b51e0).
   The required `ci` check failed in
   [run 42780786873](https://github.com/tinphan247/2026-AWAD-PA02/actions/runs/42780786873)
   and GitHub showed "Merging is blocked". The screenshot is
   [`docs/evidence/ci-pullrequest-6.png`](docs/evidence/ci-pullrequest-6.png)
   and the red log is
   [`docs/evidence/ci-github_agent_error-6.png`](docs/evidence/ci-github_agent_error-6.png).
4. **PR that turned green:** the same
   [PR #6](https://github.com/tinphan247/2026-AWAD-PA02/pull/6) after the fix
   commit
   [`75bd4aa`](https://github.com/tinphan247/2026-AWAD-PA02/commit/75bd4aa006d0dfb89f41e622c2bf4eec5214f3d4)
   restored the step 9 check without touching a test or the contract.
   [Run 42781613985](https://github.com/tinphan247/2026-AWAD-PA02/actions/runs/42781613985)
   is green; after merging `main` the same branch is also green in
   [run 42783043055](https://github.com/tinphan247/2026-AWAD-PA02/actions/runs/42783043055).
   The endpoint itself landed in
   [PR #4](https://github.com/tinphan247/2026-AWAD-PA02/pull/4).
5. **CI run for the tag:** tag `pa2` triggers the `ci` workflow. The run for the
   submitted tag is the newest entry in
   <https://github.com/tinphan247/2026-AWAD-PA02/actions/workflows/ci.yml?query=event%3Apush+branch%3Apa2>.
6. **Deliberate contract break:** [PR #6](https://github.com/tinphan247/2026-AWAD-PA02/pull/6),
   commit `5fbc56e` removed the contract §5.4 step 9 enrollment check from
   `src/domain/submissions.js`. No test changed. The timeline, failing tests,
   red and green runs, and both screenshots are recorded in
   [`docs/evidence/contract-break.md`](docs/evidence/contract-break.md).

## Checks

The four commands in [`package.json`](package.json) are the same locally and in
CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)):

```bash
npm ci
npm run lint
npm run format:check
npm run typecheck
npm test
```

CI uses Node 24 from [`.nvmrc`](.nvmrc). The suite covers the success path, all
twelve problem types, the 12-step check order, authentication and ownership,
and idempotency (`test/contract/`).

## Evidence map

| Criterion | Evidence |
| --- | --- |
| 1. Rules file | `AGENTS.md`; adapters `CLAUDE.md`, `.cursor/rules/000-project.mdc`, `.github/copilot-instructions.md`; [PR #1](https://github.com/tinphan247/2026-AWAD-PA02/pull/1) |
| 2. Permissions and secrets | three permission tiers in `AGENTS.md`; `.env.example`; `docs/evidence/secret-scan.txt`; README spending cap |
| 3. One command per check | `package.json` scripts; `.github/workflows/ci.yml`; README commands |
| 4. CI that blocks a merge | branch-protection evidence; [PR #6](https://github.com/tinphan247/2026-AWAD-PA02/pull/6) red then green |
| 5. Endpoint contract | `docs/contract/post-labs-labId-submissions.md`; [PR #3](https://github.com/tinphan247/2026-AWAD-PA02/pull/3) |
| 6. Contract tests | `test/contract/submissions.success-errors.test.js`, `submissions.idempotency.test.js`, `submissions.auth-ownership.test.js`; [PR #6](https://github.com/tinphan247/2026-AWAD-PA02/pull/6) |
| 7. AI log | `AI-LOG.md` with tool, model, changed and rejected entries |

The self-assessment with the claimed total is in
[`SELF_ASSESSMENT_REPORT.md`](SELF_ASSESSMENT_REPORT.md).

## Limitations

- PA#2 uses an in-memory repository and fixed seeded tokens. There is no
  database, queue, grader, sandbox or deployment; those are PA#3 work.
- The endpoint is version 1 and deliberately has no read endpoint, so a `201`
  has no `Location` header. Paging does not apply because the endpoint does
  not return a list.
- No model call is made by this code or by any test.
