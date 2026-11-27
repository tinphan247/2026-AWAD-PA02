# PA#2 self-assessment

Team: Phan Trung Tín (23120372), Minh Tuệ (23120398), Nguyễn Sơn Tùng
(23120399).

Repository: https://github.com/tinphan247/2026-AWAD-PA02

Claimed total: **97 / 100**. The file name is
`23120372-23120398-23120399_97.zip`.

| # | Criterion | Max | Self-score | Evidence |
| - | --------- | --: | ---------: | -------- |
| 1 | Rules file | 15 | 14 | [`AGENTS.md`](AGENTS.md) has the four parts: Stack, Commands, Conventions, Never. Two Never lines trace to real incidents recorded in AI-LOG, both in commit `8c5cad5`: [the ESLint 10 rejection](AI-LOG.md#eslint-10-upgrade) and [the unused import in the HTTP app](AI-LOG.md#unused-import-in-the-http-app). `CLAUDE.md` points to `AGENTS.md`; the Cursor and Copilot adapters do the same. Reviewed in [PR #1](https://github.com/tinphan247/2026-AWAD-PA02/pull/1). |
| 2 | Permissions and secrets | 10 | 10 | Allowed, ask-first and never tiers are in [`AGENTS.md`](AGENTS.md). [`.env.example`](.env.example) lists every variable with no values. The [README](README.md) states the spending cap of USD 0. [Gitleaks scan of the full history](docs/evidence/secret-scan.txt) on the release commit found no leaks. |
| 3 | One command per check | 10 | 10 | `npm run lint`, `npm run format:check`, `npm run typecheck` and `npm test`. [`ci.yml`](.github/workflows/ci.yml) runs exactly these four after `npm ci`, with no `continue-on-error` or `\|\| true`. The fresh-clone check on the release commit is recorded in [`docs/evidence/fresh-clone.txt`](docs/evidence/fresh-clone.txt). |
| 4 | CI that blocks a merge | 20 | 20 | Ruleset `protect-main` has been active since 2026-11-07 01:22 (+07:00). It requires a PR, one approval and the `ci` check, requires an up-to-date branch, blocks force-push and deletion, and has 0 bypass actors: [screenshot 1](docs/evidence/branch-protection-1.png), [screenshot 2](docs/evidence/branch-protection-2.png), [API dump](docs/evidence/branch-protection-api.json). [A direct push is rejected](docs/evidence/push-blocked.txt). The last direct commit on `main` (`ac91a69`, 01:20) predates the ruleset, and every change since came through a PR. [PR #6](https://github.com/tinphan247/2026-AWAD-PA02/pull/6) was blocked by a [red `ci` run](https://github.com/tinphan247/2026-AWAD-PA02/actions/runs/42780786873/job/129710055163) ([screenshot](docs/evidence/ci-pullrequest-6.png)), and commit `75bd4aa` turned it [green](https://github.com/tinphan247/2026-AWAD-PA02/actions/runs/42781613985/job/129712745826) ([screenshot](docs/evidence/ci-after_commit_fix.png)). Tag `pa2` triggers the same workflow; the run for the tag is the newest entry in <https://github.com/tinphan247/2026-AWAD-PA02/actions/workflows/ci.yml?query=event%3Apush+branch%3Apa2>. |
| 5 | Endpoint contract | 25 | 23 | [`docs/contract/post-labs-labId-submissions.md`](docs/contract/post-labs-labId-submissions.md) covers conventions, the 12 RFC 9457 error types with status and when each occurs, authentication and ownership, field rules, a 12-step check order, idempotency (scope, fingerprint, replay, reused, in flight, only a 201 stored, lifetime), paging (N/A), change policy, examples, and security and privacy. It was frozen in PR #3 before any endpoint code was written, and PR #4 implements it. |
| 6 | Contract tests that bite | 15 | 15 | Three contract test files, 116 contract tests (118 with the health-route tests), all run by the required `ci` check: [`submissions.success-errors.test.js`](test/contract/submissions.success-errors.test.js), [`submissions.idempotency.test.js`](test/contract/submissions.idempotency.test.js) and [`submissions.auth-ownership.test.js`](test/contract/submissions.auth-ownership.test.js). Each of the 12 error types in the contract has at least one test. They assert body shape, headers (`WWW-Authenticate`, `Allow`, `Idempotent-Replayed`), problem details, the JSON Pointers of validation errors, ownership (TA, admin, unenrolled, other class, identity from the token), the check order, idempotency, and submission counts. The deliberate break in [PR #6](https://github.com/tinphan247/2026-AWAD-PA02/pull/6) removed the step 9 enrollment check from `src/` only and turned CI red ([run](https://github.com/tinphan247/2026-AWAD-PA02/actions/runs/42780786873/job/129710055163), [explained](docs/evidence/contract-break.md)). When the break ran, the two tests that caught it were idempotency tests that check step 9; the direct ownership tests landed afterwards in PR #8 and would catch the same break seven times over (see "What we did not manage"). |
| 7 | AI-LOG.md | 5 | 5 | [`AI-LOG.md`](AI-LOG.md) has an entry for each assistant session, with the tool and model, prompts and real Changed and Rejected items. Examples: ESLint 10 rejected over audit findings; a test changed because HTTP strips leading header whitespace; a stub in `src/` rejected so that tests stayed red until the endpoint landed; a self-assessment draft corrected for two unverified claims. |
|   | **Total** | **100** | **97** | |

## What we did not manage

- **The deliberate break was first caught only indirectly.** When PR #6 ran,
  the two tests that went red were idempotency tests that happen to check
  step 9, because the planned auth and ownership test file had not been written
  yet. PR #8 added it afterwards. Re-running the same break on a scratch copy
  of `main` at `16dbe72` now fails 7 tests, four of them direct ownership tests
  ([details](docs/evidence/contract-break.md#the-same-break-after-pr-8)), but
  that re-run is not a CI run.
- **No AI-LOG entry for PR #8.** If an assistant helped write
  `submissions.auth-ownership.test.js`, its entry is still missing. The PR
  was also commented on by GitHub's Copilot reviewer.
- **No provider-side spending-cap screenshot.** PA#2 makes no model call, so
  there is no key to configure yet. The account owner records that evidence
  before the first PA#3 call, as the README says.
- **Small AI-LOG inaccuracy.** The PR #5 entry lists reuse of a key after a
  409, but the test for that exact sequence was added in PR #7 as part of the
  in-flight-then-failure case.
- The first self-assessment draft by Tín proposed 95. The team adopted Tuệ's
  more detailed draft and raised rows 2, 3 and 4 only after the release
  evidence existed, which gives the claimed 97.
