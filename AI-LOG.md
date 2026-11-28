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
- Changed (secret scan): the first full-history scan on the release branch
  flagged the documented example `Idempotency-Key` UUID in the contract as a
  generic API key. It is a placeholder, not a credential. `.gitleaks.toml`
  allowlists that exact UUID with the reason, and both the history and working
  tree scans then reported no leaks. No other finding was suppressed.
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

## 2026-11-10 — Tuệ — Claude Code (Claude Opus 5.5): self-assessment draft

- Task: draft `SELF_ASSESSMENT_REPORT.md` with one row per rubric criterion,
  a self-score, evidence links and a "what we did not manage" section.
- Tool/model: Claude Code in VS Code, Claude Opus 5.5. No test calls a model.
- Prompts (verbatim): "ok move to D section and E section"; "#6 at 15".
- Result: proposed total 93. Rows #2, #3 and #4 stay "pending" until the
  final secret scan, the fresh-clone check and the tag `pa2` run exist. The
  total is a draft until the team agrees on it.
- Changed: the first draft scored #6 at 11 because the contract listed
  `400 idempotency-key-missing` with no test, and no test asserted a TA 403 or a
  plain unenrolled 403. After PR #8 closed those gaps, every one of the 12
  error types has a test, and Tuệ chose 15. The assistant also corrected two
  unverified claims in its draft: a statement about how PR #4 was written, and
  a test count that included the non-contract health tests (116 contract tests,
  not 118).
- Rejected: claiming the pending rows before their evidence exists.

## 2026-11-10 — Tuệ — Claude Code (Claude Opus 5.5): reviews of PR #7 and PR #8, evidence clean-up

- Task: after the contract break, review Tín's PR #7 and Tùng's PR #8 against
  the contract, and make the break evidence easy to find. The
  self-assessment work of the same session is in the entry above.
- Tool/model: Claude Code in VS Code, Claude Opus 5.5. No test calls a model.
- Prompts (verbatim, abridged): "Review again the PR7"; "Tung has merge the
  auth-ownership.test into main with check for edge case 404. check it again,
  pull and update plan"; "#6 at 15"; "ok make it easy for graders to find";
  "remove the claude from the pull request message".
- Result (PR #7 review): adds three tests and nothing else; each matches
  §5.4 and §6 (422 before validation, 403 before a replay, an in-flight key
  released after a failed create). The approval was on the head commit
  `1417fe7`. Nit: its AI-LOG entry has no Changed or Rejected item.
- Result (PR #8 review): adds `submissions.auth-ownership.test.js` only. Every
  expectation traces to the contract, including that a query string is
  ignored (§1 and §3). With it, each of the 12 error types in the contract has
  at least one test, and `main` passes 118/118. PR #8 has no AI-LOG entry;
  Tùng was asked to add one if an assistant helped.
- Result (break re-check): the PR #6 `src/` change, applied to a scratch copy
  of `main` at `16dbe72` and never committed, fails 7 tests instead of 2.
- Result (self-assessment): the draft from PR #9 was folded into Tín's
  release PR #11, which merged with a claimed total of 97; PR #9 was closed.
- Result (evidence): `docs/evidence/contract-break.md` now opens with three
  links that show the red check of the break commit `5fbc56e` (the PR #6
  Commits tab, the commit, and the red job log), after Tuệ could not find it on
  the merged PR's page. The assistant first confirmed through the GitHub API
  that `5fbc56e` is in `main`'s history and its `ci` check is still a failure.
- Changed: a first count of problem types per test file showed zero
  `validation` and `unauthorized` assertions in the success/error file. That was
  wrong: the file uses `assertValidation()`. A recount found the real gap,
  `400 idempotency-key-missing` with no test, which PR #8 then closed.
- Changed: one CI wait read the previous commit's green run as the new one; the
  assistant caught it and waited for the run on the new head.
- Changed: at Tuệ's request, the "Generated with Claude Code" line was removed
  from the descriptions of PRs #6, #9 and #10. Assistant use stays recorded
  here.
- Rejected: opening a second break PR only to show a red check on a PR's front
  page; the existing red run is already recorded and linked.
- Rejected: rewriting merged history to remove `Co-Authored-By` trailers;
  `AGENTS.md` forbids rewriting history without asking, and protection blocks
  force-pushes to `main`.
- Not verified: the original rubric PDF is not in the workspace, so the advice
  that the break PR should be fixed and merged rather than left open rests on
  the team's copies (`PA2_TASKS.md` T3, `PA2_SOLUTION_PLAN.md` §5.4).

## 2026-11-21 — Tùng — Claude (Claude Opus 5.5): PA#3 plan review

- Task: check `PA3_PLAN.md` and the three `feat/pa3-scaffold` commits
  (`65d04fe`, `dc1060c`, `4d75d05`) against the PA#3 rubric, the class brief
  and `leetkob-eval/eval.mjs` before the team starts work on 22/11.
- Input: Tùng gave the assistant the rubric and brief PDFs and asked whether
  the plan is good enough to start, given that Tín sets up the Oracle sandbox
  VM later.
- Result: the plan covers all eight criteria and cites the FAQ entries. The
  assistant re-verified the dev set (all 128 files match `leetkob-eval.sha256`)
  and found gaps that would cost marks; this PR writes them into the plan.
- Changed: the plan said the call log must not contain source code, but
  criterion 4 requires that "the prompts in your call log show" comments and
  identity removed. The call log now stores the anonymised prompt, and
  `AGENTS.md` says so.
- Changed: `npm test` would have needed Neon and Docker, but marking runs the
  checks with the network cut. Sandbox tests move to `npm run test:sandbox`,
  run only in the CI `sandbox` job; the queue test uses an embedded Postgres.
- Changed: the review page gets an "all verdicts" tab next to the FAQ-10
  queue, because criterion 1 expects every submission × constraint and FAQ-10
  samples only 10% of passes.
- Changed: evidence `text` is taken from the original line by line number.
  `eval.mjs` (`evidenceHits`) compares against the original `.cpp` line, so a
  line with a trailing comment would otherwise count as `bad-evidence`.
- Changed: minimum 9 gets a compile-time `#include` attack; the lab form takes
  multi-file test upload; Neon's free plan (100 CU-hours per project per month,
  then suspended) is a risk because a worker polling every 1–2 s keeps it
  awake; Oracle gets a deadline of 22/11 evening; the plan records that
  `dc1060c` added the Gemini client without a test.
- Rejected: none yet; Tín reviews each point in this PR.
- Not verified: the assistant could not run `npm ci` and the four checks in its
  workspace, and could not see the CI status of `feat/pa3-scaffold`.
- Evidence: [PR #13](https://github.com/tinphan247/2026-AWAD-PA02/pull/13).

## 2026-11-22 — Tín — Claude (DeepSeek V4.1 Flash): PA#3 model and TA/student flow

- Task: implement Tín's PA#3 share: the anonymised prompt and one-call-per-
  constraint model path (C4), plus the TA create-lab, student submit and TA
  review flow (C1).
- Input: `PA3_PLAN.md` §4, `AGENTS.md`, the dev-set `constraints.json` shape,
  and the plan review recorded in PR #13.
- Result: `anonymizeCode()` blanks `//` and block comments without changing
  line count or length, redacts caller-supplied names/MSSVs and emails, and
  `buildPrompt()` now sends exactly one constraint per call. Added
  `VERDICT_RESPONSE_SCHEMA`, `src/model/cost.js` (list-price arithmetic) and
  `src/model/calllog.js` (JSONL with the anonymised prompt, request id, tokens,
  latency and cost). The web flow is server-rendered: token login, TA lab form
  with multi-file `NN.in`/`NN.out` upload, student page with constraints and
  deductions, submission status, and a review page with the FAQ-10 queue plus
  an all-verdicts tab; a TA from another class gets 403.
- Changed: `src/app.js` mounts the web router before the `/v1` contract and
  keeps `/v1` untouched; `testing.webStore` is the seam tests use to inject
  worker verdicts. `src/domain/labs.js` and `review.js` replace their throwing
  stubs with the helpers the routes use.
- Rejected: a template engine or client framework; both would add dependencies
  for a flow that plain HTML covers.
- Rejected: sending all constraints in one prompt; a single bad answer would
  have poisoned every constraint of that submission.
- Not verified: a real Gemini call (no key yet), the Oracle worker and the
  Postgres repo (Tùng's branches are not merged), and the checker dev run
  (Tuệ). The 10% pass sample is pseudo-random and stable by verdict id, not a
  true random draw; this is recorded in `src/domain/review.js`.
- Evidence: `npm test` 143/143, `npm run lint`, `npm run format:check`,
  `npm run typecheck`; `test/web/flow.test.js`, `test/unit/model-*.test.js`,
  `test/unit/review-queue.test.js`.

## 2026-11-22 — Tín — Claude (DeepSeek V4.1 Flash): model judge pipeline and README

- Task: finish the C4 integration point the worker will call, and document the
  PA#3 prototype in the README.
- Input: the plan review requirement that evidence text comes from the original
  line, and the worker boundary agreed with Tùng (Tín does not edit
  `src/queue/`).
- Result: `src/model/judge.js` runs anonymise → one-constraint prompt →
  structured call → schema check → evidence verification against the
  anonymised code → mapping to the original line. Timeout, schema failure,
  evidence mismatch, model error and cost cap all return `unsure` with a
  reason; a model `pass` drops any evidence; a violation without evidence
  becomes unsure. The call log keeps the anonymised prompt.
- Changed: added `model_error` to `UNSURE_REASONS`; README now describes the
  PA#3 flow, accounts and the model pipeline; `PA3.md` gained a local demo
  walkthrough, a cost projection and a video script link; added
  `PA3_PROGRESS.md` (per-person done/blocked board) and `docs/video-script.md`;
  `.env.example` lists `MODEL_TIMEOUT_MS` and `MODEL_CALL_LOG`; added the root
  `Dockerfile` and `.dockerignore` that `docker-compose.yml` already referenced.
- Rejected: letting the judge call the model when the lab has reached its cost
  cap; it returns `cost_cap` without a network call.
- Rejected: trusting the model's evidence text for the database or predictions
  file; the judge always writes the original line, trimmed.
- Not verified: a real Gemini call (no key yet) and the worker wiring (Tùng's
  branch). The judge is tested with an injected fake model only. The Docker
  daemon was not running, so the new root `Dockerfile` was not built locally;
  `docker compose up --build` still needs a first run on the Oracle VM or a
  machine with Docker started.
- Evidence: `test/unit/model-judge.test.js`; `npm test` 153/153.

## 2026-11-22 — Tín — Claude (DeepSeek V4.1 Flash): Oracle VM runbook and worker unit

- Task: turn the one-paragraph Oracle step in `docs/deploy.md` into something
  Tín can follow while signing up, and make the VM reproducible.
- Input: `docs/deploy.md` §3, `docker-compose.yml`, and Tùng's
  `src/sandbox/run.js` on `tung/sandbox` (it spawns `docker run` with
  `SANDBOX_IMAGE`, names containers `leetkob-sbx-*`, and needs the Docker CLI
  on the host).
- Result: `docs/oracle-vm.md` covers signup and card verification, home region,
  A1 capacity versus the AMD micro, SSH keys from Windows, the security list,
  the bootstrap script, the env file, systemd, Neon, Render, the 10-minute
  cron, a verification sequence, cost guards, troubleshooting and the
  fallback. Added `deploy/oracle-setup.sh` (idempotent: swap on small shapes,
  Docker, Node 24, clone, `npm ci --omit=dev`, sandbox image, directories,
  smoke tests), `deploy/leetkob-worker.service` (host service with
  `SupplementaryGroups=docker`, restart and sandbox cleanup) and
  `deploy/worker.env.example`.
- Changed: the root `Dockerfile` now sets `HOST=0.0.0.0`; `src/main.js`
  defaults to `127.0.0.1`, so the Render/Docker service would have refused
  every external connection. `docs/deploy.md` now links the runbook and no
  longer recommends `docker compose up worker` for production: compose would
  start a local Postgres, and a worker container would need the Docker socket.
- Rejected: mounting `/var/run/docker.sock` into a worker container so compose
  could run it; the sandbox rules forbid that pattern and the host service
  needs no socket mount.
- Rejected: publishing ports 3000 or 5432 on the VM; the worker is outbound
  only, so the security list keeps SSH from one IP.
- Not verified: there is no Oracle account yet, so neither the script nor the
  unit has run on a VM; the sandbox image was not built locally because the
  Docker daemon was not running. `runWorker` is still a stub on `main`, so the
  runbook tells the reader to enable the service only after Tùng merges.
- Evidence: `docs/oracle-vm.md`, `deploy/*`; `npm test` 153/153, `npm run
  lint`, `npm run format:check`, `npm run typecheck`.

## 2026-11-22 — Tùng — Claude (Claude Opus 5.5): sandbox and the nine attacks

- Task: criterion 2, sandbox half (PA3_PLAN.md §4.2, §4.7 row 1): sandbox
  image and runner, one attack submission per minimum, compile inside the
  sandbox, CI job. Ownership confirmed with Tín: he creates the Oracle
  account and VM; the sandbox code is Tùng's.
- Order: `f5e8dbe` (tests, red: no runner) → `d1cb18e` (runner, green) →
  `88dfb82` (CI job and `test:sandbox`, which Tùng approved first because
  AGENTS.md asks before changing scripts and CI).
- Changed: the first runner piped the program's stdout into `head -c` to cap
  output. The wall-clock attack (a child that calls `setsid()` and sleeps)
  and the fork attack (children that `pause()`) kept the pipe open, so the
  runner hung until the worker's deadline. Output now goes to a file capped
  by `ulimit -f`, and the runner, as PID 1, kills every stray process after
  each test.
- Changed: a missing image made every run look like the student's TLE. A
  container that never prints `COMPILE` now throws, so the queue retries the
  job instead of storing a verdict.
- Changed: `/tmp` as tmpfs was not writable by uid 1000; the mount now sets
  `mode=1777`.
- Rejected: copying expected outputs into the container to compare there; a
  submission could read them and print the answers. The worker compares.
- Rejected: an "allocate 1 GiB" attack without reading the memory back; the
  compiler can drop it. The attack writes every page and prints a checksum.
- Verified: `npm run test:sandbox` 12/12 locally; four checks green; with the
  network removed and loopback up, `npm test` passes (134, 12 skipped).
  Negative controls: with `-e MODEL_API_KEY=...`, a mounted Docker socket,
  `--pids-limit=400` or `--user=0:0`, the matching attack prints `LEAK`; the
  1 GiB attack ends as MLE.
- Not verified locally: Docker Hub is blocked in the assistant's workspace,
  so the local image was built on an Ubuntu 24.04 g++ 13 base instead of
  `gcc:13`; CI uses `gcc:13`. The network attack's negative control needs a
  host with internet; CI has it.
- Note: at Tùng's request, the `Co-Authored-By: Claude` and `Claude-Session`
  trailers were removed from this PR's commits before merge, keeping their
  dates; the commit ids above are the rewritten ones. Assistant use stays
  recorded here.

## 2026-11-22 — Tùng — Claude (Claude Opus 5.5): queue and exactly-once

- Task: criterion 2, queue half (PA3_PLAN.md §3.3, §4.2): schema migration,
  Postgres claim and lease, worker loop, and the "stop the worker, submit,
  start it again, judged exactly once" test. Sandbox code waits until the
  team confirms who owns it (the plan says Tùng; Tín mentioned doing it with
  the Oracle VM).
- Order: the test commit `827bc6a` came first and was red (no `migrate.js`,
  no claim code); `363e976` makes it green.
- Dependencies (AGENTS.md asks first): the assistant asked; Tùng had not
  decided, so it added the option it recommended, `pg` for Neon and
  `@electric-sql/pglite` (dev only) so `npm test` runs real SQL with the
  network cut, and the PR asks the team to confirm. `npm audit`: 0
  vulnerabilities.
- Changed: the first draft had a fixed 60 s lease. A judgement can outlast it
  (compile 10 s, 7 tests × 3 s wall, two model calls of up to 20 s), and a
  second worker would then judge the same submission. Added a heartbeat that
  extends the lease, a 120 s default, and a test with a judge five times
  slower than the lease.
- Changed: a worker dying on its last attempt left the job `claimed` forever,
  because only jobs under the attempt limit are claimable. The claim now
  marks those jobs `failed` and the submission `error`; test added.
- Changed: idle polling backs off (1 s doubling up to `WORKER_MAX_IDLE_MS`),
  following the Neon CU-hour risk in PA3_PLAN.md §3.1.
- Rejected: an in-memory fake repo for the exactly-once test; it would not
  exercise the SQL that gives exactly-once (`SKIP LOCKED`, the unique keys,
  the `claimed_by` guard).
- Rejected: running the test against Neon; marking cuts the network.
- Verified: all four checks pass locally on Node 24 (134 tests); the queue
  tests pass with the network removed (`unshare -n`).
- Not verified: pglite has one connection, so "two workers polling at once"
  checks the SQL guards but not two sessions racing for a row lock; that and
  the migration on Neon need a run with the real `DATABASE_URL`.
- Note: at Tùng's request, the `Co-Authored-By: Claude` and `Claude-Session`
  trailers were removed from this PR's commits before merge, keeping their
  dates; the commit ids above are the rewritten ones. Assistant use stays
  recorded here.

## 2026-11-23 — Tuệ — Claude Code (Claude Opus 5.5): hard rules

- Task: criterion 3 (PA3_PLAN.md §4.3): decide ban-list constraints with a
  syntax-aware rule before the model, in `src/checker/hard-rules/`, shared by
  the worker and the checker command.
- Order: the test commit `e6ca1c2` came first and was red (no module);
  `e42cc84` makes it green.
- Dependencies (AGENTS.md asks first): the assistant asked; Tuệ approved
  `web-tree-sitter@0.27.2` and `tree-sitter-cpp@0.23.4`, pinned exactly.
  Only the grammar's `.wasm` file is used; the optional native `tree-sitter`
  peer is not installed. `npm audit`: 0 vulnerabilities.
- Approach: Tuệ chose to walk the syntax tree with a table of the names the
  student declares, and to answer `unsure` whenever the rule cannot pin a
  use down, so the risk falls on the unsure rate and not on wrongful
  deductions.
- Changed: a fresh assistant reviewed the design before any code and found
  five gaps; each was settled in favour of `unsure`: a macro, typedef or
  `using` that names a banned function but is never used is `unsure`, not a
  violation; a bare name only drops `std::`, so banning `std::ranges::sort`
  does not flag a plain `sort()`; a nested type that only ends like a banned
  one (`std::vector<int>::reverse_iterator`) is `unsure`; a backticked item
  the rule cannot read makes the constraint `unsure`, never a silent `pass`;
  the result carries `decidedBy: 'hard_rule'` as evidence that the model was
  not asked.
- Changed: code inside `#if`/`#ifdef` blocks may never be compiled, so a
  banned name there is `unsure` (added while writing the code).
- Rejected: a full symbol table that models C++ name lookup; about three
  times the work before the deadline, with more room for new bugs.
- Rejected: a hand-written C++ tokenizer instead of a dependency; scope
  (`namespace my { void sort... }`) would be guesswork, and the rubric asks
  for a syntax-aware rule.
- Rejected: the native `tree-sitter` binding; it needs node-gyp and has no
  prebuild for the Alpine checker image.
- Verified: all four checks pass on Node 24.22.3 (Tuệ upgraded from 22 for
  this). On the 55 ban-list pairs of the dev set: 15 of 15 violations caught
  with a labelled line and its exact text, 40 passes, 0 wrongful
  deductions, 0 unsure (`test/hard-rules/dev-set.test.js`).
- Not verified: the held-out set; wiring the rules into the worker's judge
  (Tín); the small fixtures in `matchers.test.js` are snippets, not
  programs compiled with g++.
- Changed (cross-review, Tùng): a backslash-newline splice no longer hides a
  banned name. `std::so\` + `rt(a, a + 3);` compiles with g++ to `std::sort`
  but the rule returned `pass`, so the model was never asked. The source is
  now joined the way the compiler joins it (LF and CRLF) before parsing, and a
  line map turns every hit back into the student's own line, so the evidence
  still shows the original text. Tests were written first and failed for the
  two splice cases; four guard cases (splice inside a string, a `//` comment
  ended by a splice, a plain `'\'`, line numbers after an earlier splice)
  pass before and after.
- Rejected: returning `unsure` whenever a splice appears. It is safe but
  gives up a verdict the rule can pin down, and "outside comments and
  strings" cannot be told without the parse that the splice defeats.
- Not verified: a splice inside a raw string (`R"(...)"`), where the compiler
  undoes the splice; the joined text only changes string contents there, which
  never match. The CRLF case is tested; a lone `\r` line ending is not.
- Verified: four checks green on Node 24.22.3 (203 tests, 12 Docker attack
  tests skipped); the dev set still gives 15 of 15 violations and 0 wrongful
  deductions.

## 2026-11-23 — Tuệ — Claude Code (Claude Opus 5.5): checker command and own cases

- Task: criterion 6 (PA3_PLAN.md §4.6): `bin/check.mjs` on a dataset folder,
  `Dockerfile.checker`, a committed `MODEL_OFF=1` dev run, and our own cases
  in `leetkob-eval-extra/`.
- Order: the test commit `dda87e0` came first and was red (no decisions
  file, no argument check); `d9482f0` makes it green. The own cases
  (`dde8876`) and the dev run (`39886db`) follow.
- Changed: a no-network check was added that the plan did not ask for. A
  preload replaces `fetch`, `net`, `tls`, `http`, `https` and `dns` with
  functions that throw, so a passing `MODEL_OFF=1` test proves that no
  connection was opened. The first version passed a Windows path to
  `--import` and every test failed for that reason alone; the path is now
  a file URL.
- Changed: `decisions.jsonl` sits next to `predictions.jsonl` and records
  `decided_by` and `model_called` for each pair, so a run shows that no
  ban-list pair reached the model. Extra fields stay out of the predictions,
  so the input eval.mjs checks is unchanged.
- Changed: the image installs with `--ignore-scripts`, copies only `bin/`
  and `src/`, and runs as `node`. Built and run with `--network none`, it
  gives the same 102 predictions as a local run.
- Changed: the first eval report printed the absolute path of a team
  member's local folder. `eval.mjs` was run again in a `node:24-alpine`
  container, so the committed report shows `/repo/...`.
- Rejected: a checker that quietly treats a configured model key as
  working. The model client is not wired in yet, so the command prints a
  note and semantic pairs stay `unsure`.
- Rejected: running the own cases' C++ in CI outside the sandbox. They
  were compiled and run once locally (g++ 13.1, `-std=c++17 -O2`); all six
  are Accepted on the five tests.
- Verified: four checks green on Node 24.22.3 (210 tests, 12 Docker attack
  tests skipped). Dev run with the model off: 0 wrongful deductions; on the
  55 ban-list pairs recall is 100% and unsure is 0%; overall FAIL, recall
  40.5% and unsure 46.1%, because the 47 semantic pairs are `unsure`.
  Own cases: all 6 ban-list pairs right, including the injection and the
  macro.
- Not verified: the run with the model (`runs/pa3-dev/`, `calls.jsonl`),
  which waits for the model client (criterion 4, Tín).
- Changed (after reading the PA#3 rubric): the README had no checker
  section, and criterion 6 asks that "the README gives the command and a
  Dockerfile". It now has the command, `MODEL_OFF=1`, and the build and
  run lines.
- Changed: the image ran as `node` (uid 1000). The markers mount their own
  output folder, and a folder owned by another uid made the run fail with
  `EACCES` before any prediction was written. The assistant reproduced
  this with a folder owned by uid 4242 and removed the `USER` line, then
  ran the same folder again and the run succeeded. The checker never runs
  submissions and runs with `--network none`, so root inside it gives the
  checker nothing it can reach.
- Decided (Tuệ): the real-model run `runs/pa3-dev/` waits for Tín to wire
  the model client into the checker's `semantic` hook (criterion 4), rather
  than this PR calling the model.
- Changed (cross-review, Tùng): the README run command now drops all Linux
  capabilities and blocks new privileges. Tùng suggested
  `--cap-drop ALL --security-opt no-new-privileges`. Tuệ ran it against a
  volume owned by uid 4242: with `--cap-drop ALL` alone the run fails with
  `EACCES` on `/out/predictions.jsonl.tmp`, because root without
  `DAC_OVERRIDE` cannot write into another uid's folder. With
  `--cap-add DAC_OVERRIDE` the run writes 102 predictions (pass 40, violation
  15, unsure 47), the same as before. The README keeps that one capability
  and says why.
- Decided (Tuệ): keep `pg` in the image for now. It is a production
  dependency of the app, not of the checker, and removing it changes
  dependencies or the install step; Tùng marked it minor.
- Changed (cross-review, Tùng): the no-network preload now also blocks
  `net.Socket.prototype.connect`, `http2.connect`, `dgram`, the global
  `WebSocket` and `EventSource`, every `dns` function (callback, `promises`
  and `Resolver`) and `child_process`, which Tùng listed as uncovered. A new
  test, `no-network.test.js`, tries each channel in a child process and
  expects "network blocked by test", so a channel that stays open fails the
  test; before this, the preload itself was untested.
- Found by that test: the first version replaced `WebSocket` with an arrow
  function, which cannot be called with `new`, so it failed with "not a
  constructor" instead of the block message. It is now a class that throws in
  its constructor.
- Rejected: claiming the preload is a sandbox. It is a test guard (a native
  addon or deleting the patches gets around it); the header says so, and the
  `--network none` Docker run remains the real proof.
- Verified: four checks green on Node 24.22.3 (234 tests, 12 Docker attack
  tests skipped); the 9 model-off checker tests still pass with the wider
  block.

## 2026-11-24 — Tín — Claude (DeepSeek V4.1 Flash Free): merge main, wire the worker judge

- Task: bring `main` (sandbox, schema, queue, hard rules, checker) into
  `feat/pa3-scaffold`, then replace the `worker/index.js` judge stub with the
  real sandbox → hard rules → model pipeline (criteria 2, 3, 4 integration).
- Input: `main` at `f601c06`, `PA3_PROGRESS.md` blockers, `src/queue/worker.js`
  (`loadSubmission` returns no statement or tests), `src/model/judge.js`,
  `src/sandbox/run.js`, `src/checker/hard-rules/index.js`.
- Result: merge `554d7bf`, conflicts only in `.dockerignore` (kept the narrower
  PA#3 context) and `AI-LOG.md` (kept both sides in date order). New
  `src/judge/pipeline.js` builds the judge: it loads the lab row, runs the
  sandbox, decides every ban list with `parseBanList` + `rules.check`, asks the
  model once per semantic pair, and accumulates `model_calls` cost so later
  pairs see the money earlier ones spent. New `src/judge/recorder.js` writes
  each call to `model_calls` (authoritative) and optionally to JSONL.
  `worker/index.js` is now only env wiring.
- Changed: an `unsure` reason outside the `verdicts.unsure_reason` CHECK is
  stored as `model_unsure`; otherwise one unexpected reason would abort the
  transaction that stores the whole submission and re-bill the model on the
  retry. With no `MODEL_API_KEY` the worker runs the hard rules and marks every
  semantic pair `unsure` without a call, the same contract as `MODEL_OFF=1`.
  `deploy/worker.env.example` now lists only what the worker reads, and
  `docs/oracle-vm.md` no longer says the queue is a stub.
- Rejected: extending `loadSubmission()` in `src/queue/worker.js` with the
  statement and tests — that file is Tùng's, and the pipeline can query the lab
  row itself. Rejected: adding `model_error` to the schema now; that is a schema
  change and needs Tùng, so the worker maps it.
- Not verified: no real model call, no Docker run and no VM, so the pipeline has
  only run against injected sandbox and model doubles.
- Evidence: `npm test` 277 tests (265 pass, 12 Docker-only skipped), `npm run
  lint`, `npm run format:check`, `npm run typecheck`; merge commit `554d7bf`.

## 2026-11-26 — Tín — Claude (DeepSeek V4.1 Flash Free): Postgres-backed web store

- Task: the web UI wrote labs, submissions and verdicts to an in-memory store,
  so nothing reached `submissions`/`jobs` and the deployed worker had nothing to
  claim. Wire the UI to the same Postgres schema the worker uses.
- Result: new `src/web/postgres-store.js` implements the existing web store
  interface on `db.query`/`db.transaction`. It seeds the demo classes and users
  idempotently (tokens still come from `defaultSeed()`, so no migration and no
  schema change), and it creates a submission, flips `is_counted` on the
  previous one and calls `enqueueJob` in one transaction, so exactly one counted
  submission per student/lab becomes a job. `addVerdict` upserts on
  (submission, constraint); `decideVerdict` keeps the model evidence on a TA
  `pass` and replaces it on `violation`. `src/main.js` builds the store and runs
  `migrate(db)` at boot when `DATABASE_URL` is set; `src/server.js` passes it
  into `createApp`.
- Changed: the `src/web/store.js` typedef accepts `status: 'error'`, which the
  worker already writes.
- Rejected: a migration for demo accounts. `defaultSeed()` already has the
  tokens; the store maps token to `<name>@demo.leetkob` and creates the class
  membership on first boot.
- Not verified: no real Neon or Docker run; the new tests use pglite and drive
  `processNextJob` with a fake sandbox and a fake model.
- Evidence: `test/web/postgres-store.test.js` (7 tests), `npm run lint`,
  `npm run typecheck`.

## 2026-11-26 — Tín — Claude (DeepSeek V4.1 Flash Free): Azure runbook after Oracle capacity

- Task: Oracle Always Free refused A1 capacity in AD-1 and Tín can sign in to
  Azure for Students. Add a runbook for the same worker + sandbox on Azure
  without forking the bootstrap script.
- Result: new `docs/azure-vm.md` (portal fields, B1ms/B2s, NSG open only for
  SSH from one IP, script, env, systemd, cost, cleanup).
  `deploy/oracle-setup.sh` is now documented as provider-agnostic and installs
  `/etc/systemd/system/leetkob-worker.service` with `User=$USER` and
  `WorkingDirectory=$REPO_DIR`, because the unit template hard-codes the Oracle
  `ubuntu` account and would silently fail on Azure's `azureuser`.
  `docs/deploy.md`, `PA3.md` §1, `PA3_PROGRESS.md` and
  `deploy/worker.env.example` point at Azure and keep Oracle as the fallback.
- Rejected: renaming the script to `vm-setup.sh`. Docs, CI and earlier log
  entries already reference the old path, and the script has nothing
  Oracle-specific.
- Not verified: no Azure VM created yet, so the script has not run on Azure.
- Evidence: docs and script only; the four checks are unaffected.


## 2026-11-26 — Tín — Claude (DeepSeek V4.1 Flash Free): review fixes before merge

- Task: address Tùng's two blocking comments on PR feat/pa3-scaffold (c36328c):
  anonymise identity in string literals, and repair the double-encoded doc files.
- Result: src/judge/pipeline.js now collects whatever identity is
  available for the submission (submission.identities, studentName, studentId
  and the account's e-mail plus its local part looked up in users) and
  passes them to judgeConstraint, which feeds them to nonymizeCode. The
  users table has no name/MSSV column, so in production only the e-mail is
  redacted by the pipeline; a name or MSSV that a student types into a string
  literal is redacted only when the submission carries it. nonymizeCode
  itself already supports arbitrary identities. A new test in
  `test/unit/model-judge.test.js checks that an identity in a string literal
  becomes [REDACTED] in the prompt sent to the model. src/model/judge.js wraps callLog.record so
  a recorder failure after a paid call cannot retry and re-bill the job.
  worker/index.js prints error.message only. src/web/form.js adds the
  Secure flag to the session cookie in production. PA3_PLAN.md and
  README.md were restored from main and re-saved as UTF-8 without BOM, with
  the Oracle-to-Azure edits applied on top.
- Tests-first from here on: any new behaviour lands with its test in the same
  commit, before the implementation. (Earlier commits interleaved tests and code;
  history is not rewritten.)
- Suggestions left as follow-ups: Dockerfile USER node, Secure cookie already
  done, compile-error skip with migration 002 (Tùng's PR), tests-first going
  forward.
- Evidence: npm test 272 pass, 12 skipped; lint, format:check, typecheck clean.

## 2026-11-27 — Tùng — Claude (Claude Sonnet 5.5): skip the model on compile errors

- Task: stop paying for a model call when a submission does not compile, as a
  small PR on top of main after PR #18 merged.
- Decision (cost): when the sandbox reports `CE`, the pipeline does not call
  the model. A semantic constraint is stored as `unsure` with reason
  `compile_error`, decided by `fallback`, with no evidence, so a TA settles it
  in the review queue. Ban-list constraints still run through the hard rules
  because they cost nothing. The model never decides a mark here. The rule
  exists because broken code is the likeliest input to waste money on and the
  model's answer on code that does not build is not trustworthy anyway.
- Decision (no `MODEL_SPEND_CAP_USD` check): an earlier local draft added a
  global spend cap read from the environment and a start-up check. It was
  dropped. Main already enforces a cap per lab (`labs.cost_cap_usd`, summed
  from `model_calls`), so a second, global cap would duplicate it and could
  disagree with it. The per-lab cost-cap logic is unchanged.
- Changed: `src/judge/pipeline.js` (the `CE` branch, and `compile_error` added
  to the reasons stored as-is, otherwise the pipeline would have rewritten it
  to `model_unsure`), `src/model/schema.js` (`UNSURE_REASONS`),
  `db/migrations/002_compile_error_reason.sql` (drops and recreates
  `verdicts_unsure_reason_check`; `001_init.sql` is untouched), and the two
  reason lists in `PA3_PLAN.md`.
- Tests: written first and committed red. Two pipeline tests (a fake model
  that counts calls stays at zero on `CE` and the pair is `unsure`/
  `compile_error`; a ban list is still decided by the hard rules on `CE`) and
  `test/repo/migration-002.test.js` on pglite (accepts `compile_error`, keeps
  the old reasons, still rejects an unknown one).
- Changed test (exactly-once): the expected migration list in
  `test/queue/exactly-once.test.js` now has `002_compile_error_reason.sql`.
  The test checks that migrations apply once and are recorded, so the list
  must grow with every migration. The assertion itself is as strict as before;
  no test was deleted or weakened.
- Rejected / corrected: my first red tests used `compile: 'failed'`, which is
  not a `SandboxResult` value (`'error'` is), so `typecheck` failed. I fixed
  the value in the code commit; the assertions did not change. The first draft
  of this work was also written against the tree before #18 and was thrown away
  in favour of a fresh branch from main.
- Not verified: migration 002 has not been run on Neon. Until it is, a worker
  that stores a `compile_error` verdict would fail the insert. Run
  `node db/migrate.mjs` against Neon after merge and before enabling the worker.
- Evidence: lint, format:check and typecheck clean; `npm test` 291 tests, 279
  pass, 0 fail, 12 skipped (Docker).

## 2026-11-27 — Tùng — Claude (Claude Sonnet 5.5): first real-model dev run, checker rate limit, PA#3 documents

- Task: get one real-model dev run committed (criteria 4 and 6), keep the
  checker usable on a free tier, and fill in `PA3.md` and the PA#3
  self-assessment.
- Decision (model): `gemini-2.5-flash`, chosen in PA#2, could not be used.
  Keys from a new Google project get 404 for it (closed to new users) and the
  older project's daily quota (20 requests) was used up. The run used
  `gemini-3.1-flash-lite` on a new project's free-tier key. The cost is still
  priced with the `gemini-2.5-flash` fallback in `src/model/cost.js`, which
  over-states it; this is written in `runs/pa3-dev/README.md`.
- Changed (PR #22): the checker paces its model calls and retries only HTTP 429
  (`MODEL_MIN_INTERVAL_MS`, `MODEL_MAX_RETRIES`, `MODEL_RETRY_DELAY_MS`). Tests
  were committed first with a fake model and a fake clock; no test was loosened.
- Rejected: using the Gemini CLI as the model client to get around the daily
  quota. The PA#3 rubric wants provider request ids in the call log and calls
  a run without them a mocked one, and we did not verify that the CLI returns them. The brief
  does allow any provider and free tiers, so the rule is the call log, not the
  provider.
- Rejected: changing the dev set, the labels, the thresholds or the prompts to
  get a passing run. The run is committed as it came: FAIL, 3 wrongful
  deductions, recall 64.9%, unsure 17.6%. PA#3 has no pass mark.
- Found while reading the run: `calls.jsonl` has 36 lines for 47 model calls,
  because a failed or timed-out call is not logged. The 11 missing pairs are
  `unsure`; the decision log gives no reason per pair, so `runs/pa3-dev/README.md`
  says that part is inferred from the counts.
- Found: the temporary file that held the old key on the VM was still there
  after the run; it was removed (`shred`). Several keys were pasted into chat
  while testing quotas and must be revoked after the submission.
- Verified afterwards on the deployment: migration `002_compile_error_reason.sql`
  is applied on Neon, and the walk-through of three demo submissions works
  (lab, submit, judge, review queue, 403 across classes, students see no verdict).
- Found in the walk-through: the compliant demo got `unsure: timeout` on the
  semantic constraint because `gemini-3.1-flash-lite` takes about 17 s per call
  and the limit was 20 s. Changed: `MODEL_TIMEOUT_MS=30000` on the VM (the
  timeout stays; it was not removed). The resubmission passed. The demo lab used
  3 model calls, 2,079 tokens in, 408 out.
- Evidence: PR #22, PR #23, `runs/pa3-dev/`.

## 2026-11-27 — Tín — Claude (DeepSeek V4.1 Flash Free): Azure worker, checker model path, demo files

- Task: stand the worker up on the Azure VM, wire the semantic model into the
  checker command (criterion 6), and prove the deployment end to end before
  recording the video.
- Changed (PR #20): `bin/check.mjs` now calls the same `judgeConstraint` the
  worker uses through `src/checker/model-semantic.js`, instead of writing
  `unsure` for every semantic constraint. A run with a key writes `calls.jsonl`
  next to the predictions, tagged with the dataset keys, so the log can be
  audited without the source. `MODEL_OFF=1` or no key still means hard rules
  only and no network. Tests: the adapter maps evidence and logs a costed call;
  the dataset layer sends only semantic pairs and passes the keys.
- Changed (PR #21): `demo/` holds byte-for-byte copies of `sort-merge` `s01`,
  `s04`, `s09` (compliant, `std::sort`, prompt injection) plus the constraint
  and test sources to paste into the lab form. `docs/video-script.md` now says
  Azure instead of Oracle, uses the real deductions (3 and 4) instead of the
  placeholders (5 and 3), and the current test count.
- Verified on the VM: `deploy/oracle-setup.sh` built `leetkob-sandbox:latest`,
  installed the systemd unit with the right `User=` and `WorkingDirectory=`,
  and the three demo files compiled and passed all seven `sort-merge` tests in
  the sandbox (1.7–4.5 s each).
- Verified on the deployment: a temporary lab in class 2, created through the
  UI, took a submission that the worker judged through Neon (sandbox `AC`, ban
  list decided by the hard rule, the semantic constraint `unsure` with
  `model_unsure` because no key was set on the worker yet). The lab, the
  submission, the verdicts, the job and the call rows were deleted afterwards,
  leaving the database empty for the real walk-through.
- Rejected: moving Postgres onto the worker VM to dodge Neon's free compute
  hours. Render would have to reach it over the public internet, which is worse
  than the quota risk. Kept Neon and noted the mitigation: raise
  `WORKER_MAX_IDLE_MS` after marking so the database can scale to zero.
- Found: the first `GET /healthz` of the day took 12.5 s, so the service had
  gone to sleep. `PA3.md` said cron-job.org pings it every 10 minutes, but
  nothing in the repository or on the VM showed that job.
- Evidence: PR #20, PR #21, `runs/pa3-dev-model-off/`, the review queue of lab
  #2 on the deployment.

## 2026-11-28 — Tín — Claude (DeepSeek V4.1 Flash Free): pre-submission check

- Task: check the deployment and the repository the day before the deadline.
- Found: the worker VM was still on `f81554b`, three PRs behind `main`, so it
  was running without the checker pacing from PR #22. Pulled `main` (`325a4a7`)
  and restarted `leetkob-worker`; the unit stayed active.
- Verified: tag `pa3` (`a859d61`) has a green run with both jobs, `ci` and
  `sandbox`; the deployed review queue shows the violation evidence and the
  pass rows for lab #2; the worker holds the model key
  (`gemini-3.1-flash-lite`, `MODEL_TIMEOUT_MS=30000`).
- Found: nothing was pinging the Render service, so the cron-job.org line in
  `PA3.md` was not true. Changed: `deploy/leetkob-keepalive.service` and
  `.timer` ping `/healthz` every 10 minutes from the worker VM, which is already
  on for PA#4. Installed and enabled on the VM; a manual run returned
  `{"status":"ok"}` and the timer shows the next run. The document now names
  what is installed. `/healthz` does not query Postgres, so this does not keep
  Neon's compute awake.
- Still open at the time of writing: the video link (Tuệ records it), the final
  self-score and therefore the zip name. The tag is a lightweight tag on
  `a859d61`; if the video commit lands after it, the tag has to be moved to the
  final commit before the zip is built, or the tag and the zip disagree.
