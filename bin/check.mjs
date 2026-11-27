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
 * With MODEL_OFF=1, or with no GEMINI_API_KEY / MODEL_API_KEY, it runs the
 * hard rules only and writes `unsure` for every semantic constraint, opening
 * no network connection. With a key it calls the same `judgeConstraint` the
 * worker uses and writes `calls.jsonl` next to the predictions; the prompt in
 * that log is the anonymised one (PA#3 exception in AGENTS.md). Student source
 * code is never printed.
 */

import { mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import { DatasetError, checkDataset } from '../src/checker/dataset.js';
import { createModelSemantic } from '../src/checker/model-semantic.js';
import { createCallLog } from '../src/model/calllog.js';

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
const apiKey = process.env.GEMINI_API_KEY ?? process.env.MODEL_API_KEY ?? '';
const model = process.env.MODEL_NAME ?? 'gemini-2.5-flash';
const modelWanted = process.env.MODEL_OFF !== '1' && apiKey !== '';

mkdirSync(dirname(out), { recursive: true });

/** @type {import('../src/checker/dataset.js').SemanticCheck | null} */
let semantic = null;
if (modelWanted) {
  // A fresh log per run, next to the predictions. The prompt it stores is the
  // anonymised one the model saw (PA#3 exception in AGENTS.md), never the
  // submitted source.
  const callsPath = join(dirname(out), 'calls.jsonl');
  writeFileSync(callsPath, '', 'utf8');
  semantic = createModelSemantic({
    apiKey,
    model,
    timeoutMs: Number(process.env.MODEL_TIMEOUT_MS ?? 20_000),
    // The free tier allows about ten requests a minute: pace the calls and
    // retry a 429 (MODEL_MIN_INTERVAL_MS=0 / MODEL_MAX_RETRIES=0 turn it off).
    minIntervalMs: Number(process.env.MODEL_MIN_INTERVAL_MS ?? 7000),
    maxRetries: Number(process.env.MODEL_MAX_RETRIES ?? 3),
    retryDelayMs: Number(process.env.MODEL_RETRY_DELAY_MS ?? 20_000),
    callLog: createCallLog({ filePath: callsPath }),
  });
}

let result;
try {
  result = await checkDataset({ dataset, semantic });
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

writeJsonl(out, result.predictions);
writeJsonl(join(dirname(out), 'decisions.jsonl'), result.decisions);

/** @type {Record<string, number>} */
const counts = { pass: 0, violation: 0, unsure: 0 };
for (const p of result.predictions) counts[p.verdict] = (counts[p.verdict] ?? 0) + 1;
console.log(
  `wrote ${result.predictions.length} predictions to ${out} ` +
    `(pass ${counts.pass}, violation ${counts.violation}, unsure ${counts.unsure}; ` +
    `model ${modelWanted ? `on (${model})` : 'off'})`,
);
