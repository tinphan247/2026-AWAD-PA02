/**
 * Hard rules for ban-list constraints (PA#3, criterion 3), shared by the
 * worker and the checker command (bin/check.mjs).
 *
 *   const rules = await createHardRules();
 *   const banList = parseBanList(constraint.text); // null: semantic, ask the model
 *   if (banList) rules.check(sourceCode, banList); // never calls the model
 *
 * The C++ grammar is a WASM file shipped in the `tree-sitter-cpp` package, so
 * the rules work offline (checker image runs with `--network none`).
 */

import { createRequire } from 'node:module';
import { Language, Parser } from 'web-tree-sitter';

import { checkSource } from './engine.js';

export { parseBanList } from './ban-list.js';

/**
 * @typedef {import('./ban-list.js').BanList} BanList
 * @typedef {import('./engine.js').HardRuleResult} HardRuleResult
 * @typedef {{ check(source: string, banList: BanList): HardRuleResult }} HardRules
 */

const require = createRequire(import.meta.url);

/** @type {Promise<HardRules> | undefined} */
let loading;

/**
 * Load the C++ parser once; later calls reuse it.
 * @returns {Promise<HardRules>}
 */
export function createHardRules() {
  loading ??= load();
  return loading;
}

async function load() {
  await Parser.init();
  const cpp = await Language.load(require.resolve('tree-sitter-cpp/tree-sitter-cpp.wasm'));
  const parser = new Parser();
  parser.setLanguage(cpp);
  return {
    /**
     * @param {string} source
     * @param {BanList} banList
     */
    check(source, banList) {
      return checkSource(parser, source, banList);
    },
  };
}
