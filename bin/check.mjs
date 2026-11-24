#!/usr/bin/env node
/**
 * LeeTKOB checker (PA#3, criterion 6).
 *
 * One command, takes a dataset folder, writes a prediction JSONL file:
 *
 *   node bin/check.mjs --dataset leetkob-eval --out runs/pa3-dev/predictions.jsonl
 *
 * Next to it, `decisions.jsonl` records who decided each pair (`hard_rule`,
 * `model`, `model_off`) and whether the model was called, so a run shows that
 * no ban-list pair reached the model. predictions.jsonl keeps exactly the
 * fields eval.mjs reads.
 *
 * With MODEL_OFF=1, or with no MODEL_API_KEY, it runs the hard rules only and
 * writes `unsure` for every semantic constraint, opening no network
 * connection. Student source code is never printed.
 */

import { mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import { DatasetError, checkDataset } from '../src/checker/dataset.js';

const USAGE = 'usage: node bin/check.mjs --dataset <folder> --out <predictions.jsonl>';

/** @param {string} name */
function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const datasetArg = arg('--dataset');
const outArg = arg('--out');
if (!datasetArg || !outArg) {
  console.error(`missing --dataset or --out\n${USAGE}`);
  process.exit(2);
}

const dataset = resolve(datasetArg);
const out = resolve(outArg);
const modelWanted = process.env.MODEL_OFF !== '1' && Boolean(process.env.MODEL_API_KEY);

if (modelWanted) {
  // The model client (criterion 4) is not wired into the checker yet. Say so
  // instead of pretending; semantic constraints stay unsure.
  console.error('note: the semantic model is not wired into the checker yet; semantic = unsure');
}

let result;
try {
  result = await checkDataset({ dataset, semantic: null });
} catch (error) {
  if (!(error instanceof DatasetError)) throw error;
  console.error(`${error.message}\n${USAGE}`);
  process.exit(1);
}

/**
 * Write through a temporary file so a failed run never leaves half a file.
 * @param {string} file
 * @param {unknown[]} rows
 */
function writeJsonl(file, rows) {
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, rows.map((r) => JSON.stringify(r) + '\n').join(''), 'utf8');
  renameSync(tmp, file);
}

mkdirSync(dirname(out), { recursive: true });
writeJsonl(out, result.predictions);
writeJsonl(join(dirname(out), 'decisions.jsonl'), result.decisions);

/** @type {Record<string, number>} */
const counts = { pass: 0, violation: 0, unsure: 0 };
for (const p of result.predictions) counts[p.verdict] = (counts[p.verdict] ?? 0) + 1;
console.log(
  `wrote ${result.predictions.length} predictions to ${out} ` +
    `(pass ${counts.pass}, violation ${counts.violation}, unsure ${counts.unsure}; ` +
    `model ${modelWanted ? 'not wired' : 'off'})`,
);
