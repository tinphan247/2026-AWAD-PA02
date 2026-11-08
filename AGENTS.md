# Stack

Node.js 24, ESM JavaScript with JSDoc and TypeScript checking, ESLint,
Prettier, node:test and GitHub Actions. PA2 uses an in-memory implementation.

# Commands

Install with `npm ci`. Run `npm run lint`, `npm run format:check`,
`npm run typecheck`, and `npm test` locally and in CI. Start with `npm run dev`.

# Conventions

Agree on the endpoint contract before implementation. Name contract tests for
the behavior they check. Use RFC 9457 problem details for API errors. Keep PRs
focused and record meaningful AI assistance and review decisions in AI-LOG.md.
Do not log student identity or submitted source code.

Assistant permissions:

- **Allowed:** read the repo, edit source or docs, add tests without weakening
  assertions, run the four checks and start the local server.
- **Ask first:** change the contract, dependencies, scripts, CI, branch
  protection or schema; access a network service, use a secret or real model,
  rewrite history or force-push.
- **Never:** the actions in the section below.

# Never

- Commit secrets or expose them to a sandbox or CI logs.
- Call a real model from a unit test.
- Alter tests, evaluation data or labels merely to make a check pass.
- Delete a test.
- Adopt dependency upgrades with unresolved audit findings. See [the ESLint
  10 rejection](AI-LOG.md#eslint-10-upgrade), commit `8c5cad5`.
- Ignore lint failures or leave unused imports in the HTTP app. See [the
  scaffold lint failure](AI-LOG.md#unused-import-in-the-http-app), commit
  `8c5cad5`.
- Weaken required checks, push directly to protected main, or merge a red PR.
- Run student code outside a sandbox, or send identifiable student code to a model.
- Change the API contract silently.
