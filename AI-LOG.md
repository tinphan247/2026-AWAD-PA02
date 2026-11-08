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
