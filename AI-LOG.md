# AI log

## 2026-11-07 — Tùng — Codex (GPT-6.1 Terra)

- Task: inspect the assignment and repository, then prepare rules, permissions,
  and an environment example for review.
- Input: Tùng asked Codex to start the independent work assigned to him and aim
  for the highest rubric band.
- Result: drafted `AGENTS.md`, tool pointers, and `.env.example` on a local
  branch. The spending cap and model choice remain to be confirmed by the team.
- Changed: repository-specific commands and permissions were written against
  the existing scaffold instead of relying on generic rules.
- Rejected: no specific AI proposal has been rejected in this work yet.
- Evidence: [PR #1](https://github.com/tinphan247/2026-AWAD-PA02/pull/1).

## 2026-11-07 — Tùng — Codex (GPT-6.1 Terra): security baseline

- Task: continue the independent security work and validate the draft.
- Result: installed Gitleaks 8.30.1 via WinGet and scanned all fetched branch
  history and the working tree; no leaks were reported. See
  `docs/evidence/secret-scan.txt` for the exact scope and reproduction commands.
- Changed: README now distinguishes actual application variables from future
  model configuration and explicitly records the unresolved provider and cap.
- Rejected: no specific AI proposal was rejected during this work.
- Evidence: [PR #1](https://github.com/tinphan247/2026-AWAD-PA02/pull/1).

## 2026-11-07 — Tín — toolchain and scaffold

- Task: set up the Node.js toolchain, health endpoint, and required CI checks.
- Tool/model: OpenCode — DeepSeek V4.1 Flash Free.
- Sources: [Tín's review](https://github.com/tinphan247/2026-AWAD-PA02/pull/1#pullrequestreview-5817069400)
  describes the incidents. [Commit 8c5cad5](https://github.com/tinphan247/2026-AWAD-PA02/commit/8c5cad5)
  records the resulting scaffold. It does not contain the rejected draft.

### ESLint 10 upgrade

- Rejected: Tín reports rejecting an AI suggestion to use ESLint 10 after
  finding four moderate minimatch vulnerabilities during dependency auditing.
- Result: the scaffold lockfile resolves ESLint to 9.39.5.

### Unused import in the HTTP app

- Changed: `npm run lint` caught an unused import in `src/app.js` that the
  assistant had generated. Commit `8c5cad5` contains the corrected file. This
  incident produced a correction, not a separate rejected proposal.

## 2026-11-08 — Tín — OpenCode (DeepSeek V4.1 Flash Free)

- Task: review PR #1 against the PA#2 rubric and finish the remaining points.
- Changed: README now states a definitive USD 0 spending cap and how it is
  enforced; the scaffold entry names the actual tool and model; the two traced
  "never" lines cite commit `8c5cad5` directly.
- Rejected: refused to claim that a provider dashboard limit had been verified
  while no provider account was confirmed. The README states the cap, and the
  account owner records provider-side evidence before the first PA#3 call.
- Evidence: [PR #1](https://github.com/tinphan247/2026-AWAD-PA02/pull/1).

## 2026-11-10 — Tuệ — Claude Code (Claude Sonnet 5.5, then Claude Opus 5.5): endpoint contract

- Task: understand PA#2, plan the remaining work, and draft and freeze the
  contract for `POST /v1/labs/{labId}/submissions`.
- Tool/model: Claude Code in VS Code. Prompts 1–2 ran on Claude Sonnet 5.5;
  Tuệ switched to Claude Opus 5.5 before prompt 3, which produced the contract.
  Claude Code session `e5157a33-a858-40f0-81ad-5a499b7fdc9a`, 07:00–07:30
  (UTC+7). No application code calls a model.
- Prompts (verbatim, in order):
  1. "explain what is the goal of this homework and what i need to be done,
     create a MD file outsidee the @2026-AWAD-PA02/ folder. i am tue."
  2. "ok give me plan to complete this home work based on the repo, note that
     PR2 is merge from main successfully."
  3. "yes" (accepting the offer to draft the contract)
  4. "before create a PR, i feel ok for
     @2026-AWAD-PA02/docs/contract/post-labs-labId-submissions.md , make it
     final version and ask me to check it again before create a PR, (check
     again do i missing somethings based on @2026-AWAD-PA02/PA2_SOLUTION_PLAN.md )"
  5. "find the json file that store this conversation and store it in
     @2026-AWAD-PA02/AI-LOG.md , everythings else is ok, after this work tell
     me what need to check and after that push and create PR"
- Result: two private notes outside the repo (assignment explanation, and a
  completion plan that moves the contract freeze to 10/11 12:00), plus
  `docs/contract/post-labs-labId-submissions.md`. The contract follows the
  section layout of the IA#3 `CONTRACT.md` and the decisions in
  `PA2_SOLUTION_PLAN.md` §4.3–4.7: all 12 problem types, 12-step check order,
  idempotency, paging marked not applicable, change policy, examples, and
  security notes. `npm run format:check` and `npm run lint` pass.
- Contract ambiguities decided in the first draft (Tuệ reviewed and kept them):
  a `labId` that is not a positive integer is `404`, not `400`; route and method
  are checked before authentication; an authenticated student can tell a
  missing lab (`404`) from another class's lab (`403`), accepted because lab ids
  are not secret; the idempotency fingerprint includes `labId`; only the
  `internal` problem has a fixed `detail`; `201` has no `Location` because no
  read endpoint exists.
- Changed: in prompt 4, Tuệ asked for a second check against the solution
  plan before the freeze. That pass found six gaps a client author would have
  had to ask about. It added: the brief's unversioned path versus `/v1`, query
  strings being ignored, user roles, unlimited attempts per lab, different keys
  always creating different submissions, and a `validation` error having one
  `errors` entry in version 1.
- Rejected: the assistant pointed out that a body with only `sourceCode` makes
  the planned "several validation errors at once" test impossible, and offered
  a second required field (`language`). Tuệ kept the agreed
  `{ "sourceCode" }` body, and the contract records the one-entry rule instead.
  For prompt 5, the assistant did not copy the raw session transcript into this
  file: it holds a personal email address and full system prompts, and this
  repository is public. This entry records the prompts verbatim instead.
- Review round (PR review, same session, Claude Sonnet 5.5): a reviewer found
  two wording defects that the assistant had introduced. Changed: §3 now limits
  "unauthenticated gets 401" to requests that match the POST route, because
  route and method are checked first (§5.4 step 1). §6 now says the idempotency
  comparison covers the whole body, including ignored fields such as
  `studentId`, so changing one under the same key is `422`. The assistant laid
  out two options (whole body, or known fields only); Tuệ chose the whole body.
  Rejected: comparing known fields only, because a field added to v1 later would
  change what a stored key means.
- Evidence: the pull request that adds the contract.

## 2026-11-10 — Tuệ — Claude Code (Claude Opus 5.5): contract test helpers and success/error tests

- Task: following the team plan, write `test/contract/helpers.js` and
  `test/contract/submissions.success-errors.test.js` from the frozen contract
  only, on branch `test/contract-helpers`.
- Tool/model: Claude Code in VS Code, Claude Opus 5.5. No test calls a model.
- Prompt (verbatim): "ok i will do my job first, tin is agree with the seams
  test, follow @PLAN.md create branch test/contract-helpers and create the
  helpers.js and test/contract/submissions.success-errors.test.js, ask me to
  make sure you understand the plan"
- Decisions Tuệ made when asked: branch from `origin/main`; helpers and tests as
  two commits on one branch; seam shape `createApp({ seed, repo, hooks, clock })`
  returning `{ handler, testing }`, with the helper owning the seed; commit
  locally only, no push.
- Result: the helper is the only file that knows the test seam agreed with Tín.
  It declares the seam as JSDoc types at the top and casts the skeleton's
  `createApp` to it. `startApp()` fails with a clear message, instead of
  hanging, until the endpoint exists. `request()` always sends the body as
  bytes, because `fetch` adds `text/plain` to a string body, which would make
  the "missing `Content-Type`" test send a Content-Type. `assertProblem()` also
  checks `WWW-Authenticate` on 401 and `Allow` on 405, so no test can forget
  them.
- Result (tests): 69 tests, each named after its contract section. They cover
  the 201 shape (`studentId` from the token, unknown fields ignored, no
  `Location`, exactly one submission stored, source code not echoed), every
  `sourceCode` and non-object body rule in §5.3, including the byte-not-character
  64 KiB limit, 415, 413 and `invalid-json`, 404 for each kind of bad `labId` and
  path, 405 with `Allow: POST`, the injected 500, and the check order between
  steps 1, 2, 4, 6, 7, 8 and 11. They fail until the endpoint lands; all 69 fail
  with the "seam not implemented" message and nothing else. Lint, format and
  typecheck pass.
- Changed: the assistant first asserted problem details on the unversioned
  `/labs/{labId}/submissions` path; §2 requires them only for `/v1` paths, so
  that test now checks the 404 status only.
- Changed: the assistant first left held `beforeCreate` requests pending when
  the app closed; it changed `close()` to release every hold.
- Rejected: stubbing `createApp` in `src/` so the tests would run green before
  Tín's endpoint lands; `src/` is Tín's, and the plan expects the tests to fail
  until then.
- Evidence: the pull request that adds `test/contract/`.

## 2026-11-10 — TA-n — OpenCode (DeepSeek V4.1 Flash Free): submissions endpoint

- Task: implement `POST /v1/labs/{labId}/submissions` against the frozen
  contract and the test seam in `test/contract/helpers.js`, on branch
  `feat/submissions-endpoint` taken from `origin/test/contract-helpers`.
- Tool/model: OpenCode, DeepSeek V4.1 Flash Free. No application code calls a
  model.
- Result: `src/http/problem.js` (RFC 9457, all 12 problem types, fixed 500
  detail, `WWW-Authenticate` on 401 and `Allow: POST` on 405),
  `src/http/body.js` (128 KiB byte limit, bounded buffering), `src/auth.js`
  (Bearer parsing with a case-insensitive scheme, expiry, JSON media type,
  strict `labId`), `src/repo/memory.js` (seed maps, submissions, per-student
  idempotency records with a 24 hour lifetime, test seams), and
  `src/domain/submissions.js` (the twelve checks in contract order).
- Decisions: the key is reserved as in flight at step 10 before validation,
  then released on any non-201, so a retry after a failed request may reuse it
  while a concurrent retry gets 409. The seam hook runs after the reservation
  and validation but before the store. The idempotency fingerprint is canonical
  JSON of the whole body plus `labId`, so key order and whitespace do not
  matter and unknown fields do. Route and method are checked before
  authentication; non-`/v1` paths keep the skeleton's plain 404.
- Changed: `src/app.js` now returns `{ handler, testing }` and
  `src/server.js` uses `createApp().handler`. The health route is unchanged.
- Result (checks): `npm run lint`, `npm run format:check` and
  `npm run typecheck` pass; `npm test` passes all 71 cases, including the 69
  contract cases Tuệ wrote, without editing any test.
- Rejected: keeping a reservation after a 400/413/415/422/500 so the same key
  would be blocked; contract §6 says only a 201 is stored, so the key is freed.
- Evidence: the pull request from `feat/submissions-endpoint`.

## 2026-11-10 — TA-n — OpenCode (DeepSeek V4.1 Flash Free): idempotency tests

- Task: write `test/contract/submissions.idempotency.test.js` from contract §6
  on branch `test/idempotency`, taken from merged `main` (`59e058e`).
- Tool/model: OpenCode, DeepSeek V4.1 Flash Free. No test calls a model.
- Result: 23 cases covering same-request replay (identical stored body and
  `Idempotent-Replayed: true`, no new submission), canonical JSON equality,
  exact key comparison, different keys, per-student key scope, 422 for a
  different body or lab, 422 for a changed ignored field, 409 while the first
  request is held in `beforeCreate`, reuse of a key after 400/401/403/404/409/
  413/415/500, replay still subject to steps 2 and 9, and the 24 hour lifetime.
  `npm test` passes 94/94; lint, format and typecheck pass.
- Changed: the first draft asserted that `" exact-key"` is a different key from
  `"exact-key"`. HTTP strips leading whitespace from header values before the
  server sees them, so the test now uses an internal space, which still proves
  the server does not trim the key.
- Rejected: asserting server behaviour beyond the promised 24 hour minimum
  (e.g. that a key is forgotten at 24 hours + 1 ms); the contract promises
  retention, not expiry, so only the "still replays at 24 hours" case is
  checked.
- Evidence: the pull request from `test/idempotency`.

## 2026-11-10 — TA-n — OpenCode (DeepSeek V4.1 Flash Free): idempotency follow-up

- Task: address the three optional suggestions Tuệ left on PR #5, on branch
  `test/idempotency-followup` from merged `main` (`09280f7`).
- Tool/model: OpenCode, DeepSeek V4.1 Flash Free. No test calls a model.
- Result: three more cases — a reused key with an invalid body is `422`, not
  `400` (step 10 before step 11); a replay with the same key in a lab of
  another class is `403` (step 9 before step 10); and a first request that
  fails after being held releases the in-flight key, so a third request with
  that key creates. The third suggestion did not find a bug: the
  implementation already releases the reservation in its create failure path.
- Result (checks): `npm test` passes 97/97; lint, format and typecheck pass.
- Evidence: the follow-up pull request from `test/idempotency-followup`.

## 2026-11-10 — TA-n — OpenCode (DeepSeek V4.1 Flash Free): release documents

- Task: prepare Tín's W9 release work — `PA2.md`, the self-assessment report,
  the README status and layout, and a current-status block in
  `PA2_PROGRESS.md`.
- Tool/model: OpenCode, DeepSeek V4.1 Flash Free.
- Result: `PA2.md` links the repository, the branch-protection evidence, the
  blocked PR #6, the commit and run that turned it green, the tag run page and
  the deliberate-break evidence. The first self-assessment draft had one row
  per rubric criterion, a claimed total of 95 and a "what we did not manage"
  section. Tuệ's more detailed draft was merged into the same release branch;
  the team agreed the final total after the release evidence existed.
- Changed: the README still described PA#2 as a skeleton waiting for the
  endpoint contract; it now records the completed endpoint and the new source
  layout.
- Rejected: claiming 100/100. The provider-side cap evidence is not in the
  repository, and the first deliberate break was caught by the idempotency
  suite rather than the success/error suite; both facts are in the report.
- Evidence: the pull request from `docs/pa2-release`.

## 2026-11-10 — Tuệ — Claude Code (Claude Sonnet 5.5, then Claude Opus 5.5): PR #5 review and deliberate contract break

- Task: review PR #5 against contract §6 only, then break the contract on
  purpose in `src/` to show that CI blocks the merge.
- Tool/model: Claude Code in VS Code, Claude Sonnet 5.5 for the review and
  Claude Opus 5.5 for the break. No test calls a model.
- Prompts (verbatim): "read the PR now … and validate the review"; "ok move to
  D section and E section"; "open the PR now".
- Result (review): every §6 rule has a test in PR #5, the diff adds tests only,
  and 94/94 pass on the PR head. Two scratch tests, never committed, confirmed
  that the server already returns 422 before validation (step 10 before 11) and
  403 before a replay (step 9 before 10). Tín then asserted both in PR #7.
- Result (break): on `test/contract-break` the step 9 enrollment check was
  removed from `src/domain/submissions.js`, with no test changed. CI went red
  with 92 pass and 2 fail, and the merge was blocked:
  [PR #6](https://github.com/tinphan247/2026-AWAD-PA02/pull/6),
  [red run](https://github.com/tinphan247/2026-AWAD-PA02/actions/runs/42780786873/job/129710055163),
  `docs/evidence/ci-pullrequest-6.png` and
  `docs/evidence/ci-github_agent_error-6.png`, explained in
  [`docs/evidence/contract-break.md`](docs/evidence/contract-break.md).
- Caught by: `contract §6 — a replay is still checked against step 9:
  unenrolled after the 201 → 403, nothing new` and `contract §6 — a 403 (not
  the owner) stores nothing: the same key accepts a lab of the caller`.
- Finding: only those two idempotency tests caught the break. No test in
  `submissions.success-errors.test.js` asserts `403 forbidden` for step 3 (a TA)
  or step 9 (not enrolled), although `helpers.js` seeds `TOKENS.TA` and
  `TOKENS.S3` for it. Without PR #5 this break would have merged green. Also,
  the PR #5 entry above lists reuse after a 409, but no such test exists.
- Follow-up: Tùng's PR #8 added `submissions.auth-ownership.test.js`. With it
  on `main` (`16dbe72`), the same break applied to a scratch copy, never
  committed, fails 7 tests instead of 2, four of them direct ownership tests:
  `contract §3 student without enrollment`, `contract §3 student enrolled in
  another class`, `contract §3 body identity grants no enrollment` and
  `contract §5.4 ownership before field validation`.
- Fix: the break commit is reverted on the same branch, so `src/` is identical
  to `main` again; the four checks pass, with 94/94 tests before PR #7, 97/97
  after PR #7 and 118/118 after PR #8 were merged into the branch.
- Evidence (after the fix): `docs/evidence/ci-after_commit_fix.png` shows the
  PR #6 commit list with `5fbc56e` red and every later commit green.
- Rejected: editing a test to make the break pass, or weakening the required
  check; both are forbidden by `AGENTS.md`.
