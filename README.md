# LeeTKOB — PA#2 harness and quality gate

PA#2 checkpoint for **CSC13114 — Advanced Web Application Development**.
This repository is the ground the LeeTKOB product stands on before the LLM
feature arrives in PA#3.

## Status

This is the PA#2 walking skeleton: toolchain, health route and CI are in place.
The contract and implementation of
`POST /v1/labs/{labId}/submissions` are the next deliverable.

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
src/app.js             HTTP application factory (health route for now)
src/server.js          startServer() for tests and production
src/main.js            process entry point
test/unit/             unit and smoke tests
.github/workflows/     required CI
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

The spending cap and the planned model for PA#3 will be recorded here by the
rules/security owner.
