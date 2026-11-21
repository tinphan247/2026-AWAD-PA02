#!/usr/bin/env node
/**
 * LeeTKOB checker (PA#3, criterion 6).
 *
 * One command, takes a dataset folder, writes a prediction JSONL file:
 *
 *   node bin/check.mjs --dataset leetkob-eval --out runs/pa3-dev/predictions.jsonl
 *
 * With MODEL_OFF=1 (or no model configured) it runs the hard rules only and
 * writes `unsure` for every semantic constraint, opening no network connection.
 *
 * This is a scaffold: the hard rules are naive today and will be replaced by
 * the syntax-aware implementation in the hard-rules commit.
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const dataset = resolve(arg('--dataset') ?? '.');
const out = resolve(arg('--out') ?? 'predictions.jsonl');
const modelOff = process.env.MODEL_OFF === '1';

const problemsDir = join(dataset, 'problems');
const solutionsDir = join(dataset, 'solutions');

const problemIds = readdirSync(problemsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

const lines = [];

for (const problemId of problemIds) {
  const constraints = JSON.parse(
    readFileSync(join(problemsDir, problemId, 'constraints.json'), 'utf8'),
  );
  const solutionDir = join(solutionsDir, problemId);
  const solutionFiles = readdirSync(solutionDir)
    .filter((f) => f.endsWith('.cpp'))
    .sort();

  for (const file of solutionFiles) {
    const solutionId = `${problemId}/${file.replace(/\.cpp$/, '')}`;
    const source = readFileSync(join(solutionDir, file), 'utf8');
    const sourceLines = source.split('\n');

    for (const constraint of constraints) {
      // Scaffold verdict: unsure for everything. The hard-rules commit replaces
      // this with syntax-aware ban-list detection and the model handles the
      // semantic constraints.
      const verdict = 'unsure';
      const evidence = [];

      // Minimal, conservative ban-list check so the file is never empty and
      // the output stays valid JSONL. This is intentionally naive.
      if (isBanList(constraint.text) && !modelOff) {
        // no-op in scaffold; real detection lands later
      }
      void sourceLines;

      lines.push(
        JSON.stringify({
          solution: solutionId,
          constraint: constraint.id,
          verdict,
          evidence,
        }),
      );
    }
  }
}

mkdirSync(join(out, '..'), { recursive: true });
writeFileSync(out, lines.join('\n') + (lines.length ? '\n' : ''), 'utf8');

console.log(`wrote ${lines.length} predictions to ${out} (MODEL_OFF=${modelOff ? 1 : 0})`);

function isBanList(text) {
  return /^Do not (use|call)\b/.test(text.trim());
}
