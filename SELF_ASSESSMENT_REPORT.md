# PA#2 self-assessment

> **DRAFT, drafted by Tuệ on 2026-11-10.** The scores are a proposal. The team
> must agree on the total before the zip is named
> `23120372-23120398-23120399_<total>.zip`. Rows marked "pending" will change
> once the work listed in "What we did not manage" is done or dropped.

Repository: https://github.com/tinphan247/2026-AWAD-PA02

| # | Criterion | Max | Self-score | Evidence |
| - | --------- | --: | ---------: | -------- |
| 1 | Rules file | 15 | 14 | [`AGENTS.md`](AGENTS.md) has the four parts: Stack, Commands, Conventions, Never. Two Never lines trace to real incidents recorded in AI-LOG, both in commit `8c5cad5`: [the ESLint 10 rejection](AI-LOG.md#eslint-10-upgrade) and [the unused import in the HTTP app](AI-LOG.md#unused-import-in-the-http-app). `CLAUDE.md` points to `AGENTS.md`. |
| 2 | Permissions and secrets | 10 | 9 (pending) | Allowed, ask-first and never tiers are in [`AGENTS.md`](AGENTS.md). [`.env.example`](.env.example) lists every variable with no values. The [README](README.md) states the spending cap of USD 0. [Gitleaks scan of the full history](docs/evidence/secret-scan.txt) from 2026-11-07 found no leaks. Pending: re-run the scan on the final commit. |
| 3 | One command per check | 10 | 9 (pending) | `npm run lint`, `npm run format:check`, `npm run typecheck` and `npm test`. [`ci.yml`](.github/workflows/ci.yml) runs exactly these four after `npm ci`, with no `continue-on-error` or `\|\| true`. A fresh-clone check was recorded in commit `9957e84`. Pending: re-run it on the final commit. |
| 4 | CI that blocks a merge | 20 | 18 (pending) | Ruleset `protect-main` has been active since 2026-11-07 01:22 (+07:00). It requires a PR, one approval and the `ci` check, blocks force-push and deletion, and has 0 bypass actors: [screenshot 1](docs/evidence/branch-protection-1.png), [screenshot 2](docs/evidence/branch-protection-2.png), [API dump](docs/evidence/branch-protection-api.json). [A direct push is rejected](docs/evidence/push-blocked.txt). The last direct commit on `main` (`ac91a69`, 01:20) predates the ruleset, and every change since came through PR #1 to #5. [PR #6](https://github.com/tinphan247/2026-AWAD-PA02/pull/6) was blocked by a [red `ci` run](https://github.com/tinphan247/2026-AWAD-PA02/actions/runs/42780786873/job/129710055163) ([screenshot](docs/evidence/ci-pullrequest-6.png)), and commit `75bd4aa` turned it [green](https://github.com/tinphan247/2026-AWAD-PA02/actions/runs/42781613985/job/129712745826) ([screenshot](docs/evidence/ci-after_commit_fix.png)). Pending: the green CI run for tag `pa2`. |
| 5 | Endpoint contract | 25 | 23 | [`docs/contract/post-labs-labId-submissions.md`](docs/contract/post-labs-labId-submissions.md) covers conventions, the 12 RFC 9457 error types with status and when each occurs, authentication and ownership, field rules, a 12-step check order, idempotency (scope, fingerprint, replay, reused, in flight, only a 201 stored, lifetime), paging (N/A), change policy, examples, and security and privacy. It was frozen in PR #3 before any endpoint code was written, and PR #4 implements it. |
| 6 | Contract tests that bite | 15 | 14 | Three contract test files, 116 tests (118 with the health-route tests), all run by the required `ci` check: [`submissions.success-errors.test.js`](test/contract/submissions.success-errors.test.js), [`submissions.idempotency.test.js`](test/contract/submissions.idempotency.test.js) and [`submissions.auth-ownership.test.js`](test/contract/submissions.auth-ownership.test.js). Each of the 12 error types in the contract has at least one test. They assert body shape, headers (`WWW-Authenticate`, `Allow`, `Idempotent-Replayed`), problem details, the JSON Pointers of validation errors, ownership (TA, admin, unenrolled, other class, identity from the token), the check order, idempotency, and submission counts. The deliberate break in [PR #6](https://github.com/tinphan247/2026-AWAD-PA02/pull/6) removed the step 9 enrollment check from `src/` only and turned CI red ([run](https://github.com/tinphan247/2026-AWAD-PA02/actions/runs/42780786873/job/129710055163), [explained](docs/evidence/contract-break.md)). One point off: when the break ran, only two idempotency tests caught it; the direct ownership tests (PR #8) landed afterwards. |
| 7 | AI-LOG.md | 5 | 5 | [`AI-LOG.md`](AI-LOG.md) has an entry for each assistant session, with the tool and model, prompts and real Changed and Rejected items. Examples: ESLint 10 rejected over audit findings; a test changed because HTTP strips leading header whitespace; a stub in `src/` rejected so that tests stayed red until the endpoint landed. |
|   | **Total** | **100** | **92** | |

## What we did not manage

- **The deliberate break was first caught only indirectly.** When PR #6 ran,
  the two tests that went red were idempotency tests that happen to check
  step 9, because the planned auth and ownership test file had not been written
  yet. PR #8 added it afterwards. Re-running the same break on a scratch copy
  of `main` at `16dbe72` now fails 7 tests, four of them direct ownership tests
  ([details](docs/evidence/contract-break.md#the-same-break-after-pr-8)), but
  that re-run is not a CI run.
- **Final checks on the release commit are not yet re-run:** the secret scan,
  the fresh-clone check and the CI run for tag `pa2` (rows 2, 3 and 4 are
  marked "pending" for this reason).
- **No AI-LOG entry for PR #8.** If an assistant helped write
  `submissions.auth-ownership.test.js`, its entry is still missing. The PR
  was also commented on by GitHub's Copilot reviewer.
- **Small AI-LOG inaccuracy.** The PR #5 entry lists reuse of a key after a
  409, but no such test exists. PR #7 adds the related case, where an in-flight
  key is released after a failed create.

## If the pending rows are closed before the tag

If the final secret scan and fresh-clone check pass on the release commit and
the tag `pa2` run is green, the team may raise #2 to 10, #3 to 10 and #4 to
19–20, for a total of about 95. Raise only the rows whose evidence actually
exists at submission time.
