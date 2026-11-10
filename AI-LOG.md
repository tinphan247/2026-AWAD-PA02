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
