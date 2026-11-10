# LeeTKOB — PA#2 harness and quality gate

PA#2 checkpoint for **CSC13114 — Advanced Web Application Development**.
This repository is the ground the LeeTKOB product stands on before the LLM
feature arrives in PA#3.

## Status

PA#2 is complete. The toolchain, health route and required CI are in place,
`POST /v1/labs/{labId}/submissions` is implemented, and its contract tests
cover success, errors, authentication, ownership and idempotency.

- Contract: [`docs/contract/post-labs-labId-submissions.md`](docs/contract/post-labs-labId-submissions.md)
- Submission links and evidence: [`PA2.md`](PA2.md)
- Self-assessment: [`SELF_ASSESSMENT_REPORT.md`](SELF_ASSESSMENT_REPORT.md)

## Requirements

- **Node.js 24 LTS** (see `.nvmrc`; CI uses the same version)
- npm 11+

## Commands

```bash
npm ci
npm run lint
npm run format:check
npm run typecheck
npm test
```

These are the exact commands CI runs. A fresh clone that follows this README
must be green.

Local development:

```bash
npm run dev
```

The server listens on `127.0.0.1:3000` by default. Override with `PORT` /
`HOST`.

## Project layout

```text
src/app.js                  HTTP application factory and routing
src/server.js               startServer() for tests and production
src/main.js                 process entry point
src/auth.js                 bearer token, content type and lab id parsing
src/domain/submissions.js   the 12 checks for the endpoint
src/http/                   RFC 9457 problem details and body reading
src/repo/memory.js          in-memory seed, submissions and idempotency store
test/contract/              contract tests and their shared seam
test/unit/                  unit and smoke tests
docs/contract/              frozen endpoint contract
docs/evidence/              branch protection, secret scan and contract break
.github/workflows/          required CI
```

## Scope of PA#2

In scope: rules, permissions, secrets handling, four checks, a blocking CI,
one LeeTKOB endpoint contract and its contract tests.

Out of scope for this checkpoint: the LLM feature, sandbox, submission queue,
review queue, publishing, appeals, load testing and public deployment.

## Secrets

No secret belongs in this repository. The model API key is read only from the
environment, must never be visible inside the sandbox, and must have a spending
cap on the provider dashboard. PA#2 makes no model calls.

Only `HOST` and `PORT` are currently read by the application; `.env.example`
lists them without values. The application does not load a `.env` file itself.
The `MODEL_*` and `DATABASE_PATH` entries are reserved for PA#3.

PA#2 makes no model calls, so its model API cost is USD 0.

The LeeTKOB model API **spending cap is USD 0**. Paid API billing is not
enabled for this project and may only be enabled after the whole team agrees,
so no model call can create a charge while the cap stands. The application may
use free-tier quota only, and the account owner must check the provider's
free-tier limits before any call. The provider and exact model ID are chosen
in PA#3 after that check; they are deliberately not fixed here. The account
owner is Tùng (security lead) and Tín reviews the evidence. The account owner
records the provider-side limit and its evidence before the first PA#3 call.
PA#3 per-lab cost will be measured during evaluation.

The history scan procedure and its scope are recorded in
`docs/evidence/secret-scan.txt`. Repeat the scan on the final submission commit.
