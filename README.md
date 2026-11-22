# LeeTKOB — PA#2 harness and PA#3 prototype

PA#2 checkpoint for **CSC13114 — Advanced Web Application Development**.
This repository is the ground the LeeTKOB product stands on before the LLM
feature arrives in PA#3. PA#3 adds that feature on the same repository.

## Status

PA#2 is complete. The toolchain, health route and required CI are in place,
`POST /v1/labs/{labId}/submissions` is implemented, and its contract tests
cover success, errors, authentication, ownership and idempotency.

PA#3 is in progress. The model pipeline, the TA/student web flow and the
review queue are implemented and tested; the Postgres repository, the sandbox,
the worker and the checker are on their own branches. [`PA3.md`](PA3.md)
tracks what is still TODO.

- Contract: [`docs/contract/post-labs-labId-submissions.md`](docs/contract/post-labs-labId-submissions.md)
- Submission links and evidence: [`PA2.md`](PA2.md)
- PA#3 status, accounts and FAQ compliance: [`PA3.md`](PA3.md)
- Self-assessment: [`SELF_ASSESSMENT_REPORT.md`](SELF_ASSESSMENT_REPORT.md)

## PA#3 prototype

- **TA flow:** create a lab through the UI with a statement, constraints
  (`text | deduction`) and a multi-file `NN.in`/`NN.out` upload.
- **Student flow:** see the statement, constraints and deductions before
  submitting; after submitting see `queued/judging/judged` and per-test
  results, but not test input/output (FAQ-02) and not constraint verdicts
  before the TA publishes (FAQ-08).
- **TA review:** the FAQ-10 queue (every violation, every unsure,
  `ceil(10%)` of passes) plus an all-verdicts tab, with evidence lines and the
  deduction. A TA of another class gets 403.
- **Model pipeline** (`src/model/judge.js`): anonymise the code (comments,
  name, MSSV and email removed, line numbers unchanged), send one constraint
  per call, validate the schema, verify every evidence line, then map it back
  to the original line. Any failure becomes `unsure` with a reason; the model
  never sets a deduction.
- **Call log** (`src/model/calllog.js`): request id, tokens, latency,
  list-price cost and the anonymised prompt.

Architecture: Render (web) + Oracle Cloud Always Free (worker and Docker
sandbox) + Neon (Postgres) + Gemini free tier. See
[`docs/deploy.md`](docs/deploy.md).

Demo accounts (token login at `/login`): `admin-token`, `ta1-token`,
`ta2-token`, `sv1-token`, `sv2-token`, `sv3-token`. Only the accounts are
seeded; every lab is created through the UI.

Current limits: the web store is in memory until the Postgres repository
lands, so a restart drops labs. `npm test` stays offline: it needs no Docker,
database or network.

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

Only `HOST` and `PORT` are currently read by the web process; `.env.example`
lists the rest without values. The application does not load a `.env` file
itself.

In PA#3 the model API key is read only on the Oracle worker. It is never set on
Render and never passed into the sandbox. The UI and the worker share the
database, not the key.

PA#2 makes no model calls, so its model API cost is USD 0.

The LeeTKOB model API **spending cap is USD 0**. Paid API billing is not
enabled for this project and may only be enabled after the whole team agrees,
so no model call can create a charge while the cap stands. The application may
use free-tier quota only, and the account owner must check the provider's
free-tier limits before any call. PA#3 uses `gemini-2.5-flash` on the free tier. `src/model/cost.js` records the
list price of every call, so the cost per lab is measurable while the bill
stays USD 0. PA#3 per-lab cost is measured during evaluation.

The history scan procedure and its scope are recorded in
`docs/evidence/secret-scan.txt`. Repeat the scan on the final submission commit.
