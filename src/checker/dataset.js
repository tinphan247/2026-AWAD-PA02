/**
 * Run the constraint checker over a dataset folder (PA#3, criterion 6).
 *
 * The folder has the layout of `leetkob-eval/`: `problems/<id>/statement.md`,
 * `problems/<id>/constraints.json` and `solutions/<id>/<sNN>.cpp`. Nothing is
 * configured per problem, so the same run works on the held-out set.
 * `labels.jsonl` is never read.
 *
 * Ban-list constraints go to the hard rules and never to the model. Semantic
 * constraints go to `semantic`; with the model off they are `unsure`.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { createHardRules, parseBanList } from './hard-rules/index.js';

/**
 * @typedef {{ line: number, text: string }} Evidence
 * @typedef {{ solution: string, constraint: string, verdict: 'pass' | 'violation' | 'unsure', evidence: Evidence[] }} Prediction
 * @typedef {{ solution: string, constraint: string, decided_by: 'hard_rule' | 'model' | 'model_off', model_called: boolean }} Decision
 * @typedef {(input: { statement: string, constraint: { id: string, text: string }, source: string }) =>
 *   Promise<{ verdict: Prediction['verdict'], evidence: Evidence[] }>} SemanticCheck
 *   Only called when the model is on; its evidence must already hold original lines.
 */

export class DatasetError extends Error {}

/**
 * @param {{ dataset: string, semantic: SemanticCheck | null }} options
 *   `semantic: null` means the model is off: no call, every semantic pair unsure.
 * @returns {Promise<{ predictions: Prediction[], decisions: Decision[] }>}
 */
export async function checkDataset({ dataset, semantic }) {
  const problemsDir = join(dataset, 'problems');
  const solutionsDir = join(dataset, 'solutions');
  if (!existsSync(problemsDir)) {
    throw new DatasetError(`not a dataset folder: no problems/ directory in ${dataset}`);
  }

  const rules = await createHardRules();
  /** @type {Prediction[]} */
  const predictions = [];
  /** @type {Decision[]} */
  const decisions = [];

  for (const problem of listDirs(problemsDir)) {
    const constraints = readConstraints(join(problemsDir, problem, 'constraints.json'));
    const statementFile = join(problemsDir, problem, 'statement.md');
    const statement = existsSync(statementFile) ? readFileSync(statementFile, 'utf8') : '';
    const banLists = constraints.map((c) => parseBanList(c.text));
    const solutionDir = join(solutionsDir, problem);
    const files = existsSync(solutionDir)
      ? readdirSync(solutionDir)
          .filter((f) => f.endsWith('.cpp'))
          .sort(byName)
      : [];

    for (const file of files) {
      const solution = `${problem}/${file.slice(0, -'.cpp'.length)}`;
      const source = readFileSync(join(solutionDir, file), 'utf8');

      for (const [i, constraint] of constraints.entries()) {
        const banList = banLists[i];
        /** @type {Prediction['verdict']} */
        let verdict = 'unsure';
        /** @type {Evidence[]} */
        let evidence = [];
        /** @type {Decision['decided_by']} */
        let decidedBy = 'model_off';
        let modelCalled = false;

        if (banList) {
          ({ verdict, evidence } = rules.check(source, banList));
          decidedBy = 'hard_rule';
        } else if (semantic) {
          ({ verdict, evidence } = await semantic({ statement, constraint, source }));
          decidedBy = 'model';
          modelCalled = true;
        }

        predictions.push({ solution, constraint: constraint.id, verdict, evidence });
        decisions.push({
          solution,
          constraint: constraint.id,
          decided_by: decidedBy,
          model_called: modelCalled,
        });
      }
    }
  }
  return { predictions, decisions };
}

/** @param {string} dir */
function listDirs(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort(byName);
}

/**
 * @param {string} file
 * @returns {{ id: string, text: string }[]}
 */
function readConstraints(file) {
  let value;
  try {
    value = JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new DatasetError(`cannot read ${file}: ${reason}`);
  }
  const valid =
    Array.isArray(value) &&
    value.every((c) => c && typeof c.id === 'string' && typeof c.text === 'string');
  if (!valid) throw new DatasetError(`${file}: expected [{ "id": string, "text": string }]`);
  return value;
}

/**
 * @param {string} a
 * @param {string} b
 */
function byName(a, b) {
  return a.localeCompare(b, 'en', { numeric: true });
}
