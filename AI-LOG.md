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
- Evidence: branch `tung/rules-security`; PR pending.

## 2026-11-07 — Tùng — Codex (GPT-6.1 Terra): security baseline

- Task: continue the independent security work and validate the draft.
- Result: installed Gitleaks 8.30.1 via WinGet and scanned all fetched branch
  history and the working tree; no leaks were reported. See
  `docs/evidence/secret-scan.txt` for the exact scope and reproduction commands.
- Changed: README now distinguishes actual application variables from future
  model configuration and explicitly records the unresolved provider and cap.
- Rejected: no specific AI proposal was rejected during this work.
- Evidence: branch `tung/rules-security`; PR pending.
