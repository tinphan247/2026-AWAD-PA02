/**
 * Syntax-aware ban-list rules for C++ (PA#3, criterion 3).
 *
 * The source is parsed with tree-sitter; comments, strings and `#include`
 * lines are separate nodes, so they never match. Each banned name is matched
 * by the kind of node it can be: a loop or `new` statement, a qualified name
 * (`std::sort`, `std::string::npos`), a plain identifier or type, or a member
 * call (`v.rbegin()`).
 *
 * The rules never guess a violation. A name the student declared themselves
 * is theirs inside the scope that declares it; a use the rules cannot pin down
 * (outside that scope, in code the parser could not read, behind an unused
 * macro or alias) is `unsure`, so the TA decides.
 */

/**
 * @typedef {import('web-tree-sitter').Node} TsNode
 * @typedef {import('web-tree-sitter').Parser} TsParser
 * @typedef {import('./ban-list.js').BanList} BanList
 *
 * @typedef {{
 *   verdict: 'pass' | 'violation' | 'unsure',
 *   evidence: { line: number, text: string }[],
 *   unsureReason: 'hard_rule_unsure' | null,
 *   decidedBy: 'hard_rule',
 * }} HardRuleResult
 *
 * @typedef {{ kind: 'keyword', name: string, nodeTypes: string[] }
 *   | { kind: 'plain', name: string }
 *   | { kind: 'qualified', name: string, segs: string[], bareForms: string[][] }} Spec
 *
 * @typedef {{ line: number, sure: boolean, node: TsNode }} Hit
 *
 * `null` scope: the whole file. `undefined`: not a declaration.
 * @typedef {TsNode | null} Scope
 */

/** @type {Readonly<Record<string, string[]>>} */
const KEYWORD_NODES = {
  for: ['for_statement', 'for_range_loop'],
  while: ['while_statement'],
  do: ['do_statement'],
  goto: ['goto_statement'],
  new: ['new_expression'],
  delete: ['delete_expression'],
  switch: ['switch_statement'],
  throw: ['throw_statement', 'throw_expression'],
  continue: ['continue_statement'],
  break: ['break_statement'],
};

const SCOPES = new Set([
  'translation_unit',
  'declaration_list',
  'field_declaration_list',
  'compound_statement',
  'function_definition',
  'lambda_expression',
  'for_statement',
  'for_range_loop',
]);
const DECLARATOR_WRAPPERS = new Set([
  'pointer_declarator',
  'reference_declarator',
  'array_declarator',
  'parenthesized_declarator',
  'function_declarator',
  'init_declarator',
  'attributed_declarator',
]);
const DECLARATOR_HOLDERS = new Set([
  'declaration',
  'field_declaration',
  'parameter_declaration',
  'optional_parameter_declaration',
  'variadic_parameter_declaration',
  'function_definition',
  'type_definition',
  'for_range_loop',
  'friend_declaration',
]);
const PARAMETERS = new Set([
  'parameter_declaration',
  'optional_parameter_declaration',
  'variadic_parameter_declaration',
]);
const NAME_HOLDERS = new Set([
  'namespace_definition',
  'namespace_alias_definition',
  'alias_declaration',
  'enumerator',
  'optional_type_parameter_declaration',
  'concept_definition',
]);
const TYPE_HOLDERS = new Set([
  'struct_specifier',
  'class_specifier',
  'union_specifier',
  'enum_specifier',
]);
const MACROS = new Set(['preproc_def', 'preproc_function_def']);
const CONDITIONALS = new Set([
  'preproc_if',
  'preproc_ifdef',
  'preproc_else',
  'preproc_elif',
  'preproc_elifdef',
]);
const MACRO_WRAPPER = 'void __leetkob_macro__() {\n';

/**
 * @param {TsParser} parser
 * @param {string} source
 * @param {BanList} banList
 * @returns {HardRuleResult}
 */
export function checkSource(parser, source, banList) {
  const sourceLines = source.split('\n').map((l) => l.replace(/\r$/, ''));
  const tree = parser.parse(source);
  if (!tree) return result('unsure', [], sourceLines);

  const file = describeFile(parser, tree.rootNode);
  const specs = banList.names.map((name) => toSpec(name, file));

  /** @type {Hit[]} */
  const hits = [];
  for (const hit of findHits(file.nodes, specs, file, { macroParams: null })) {
    hits.push(...widenAlias(hit, file));
  }
  for (const macro of file.macros) {
    const inner = findHits(macro.nodes, specs, file, { macroParams: macro.params });
    if (inner.length === 0) continue;
    const uses = namedUses(file.nodes, macro.name);
    const anySure = inner.some((h) => h.sure);
    hits.push({ line: macro.line, sure: anySure && uses.length > 0, node: macro.node });
    if (anySure) {
      for (const use of uses) hits.push({ line: lineOf(use), sure: true, node: use });
    }
  }

  const sure = uniqueLines(hits.filter((h) => h.sure));
  if (sure.length > 0) return result('violation', sure, sourceLines);
  const doubt = uniqueLines(hits);
  if (doubt.length > 0 || banList.unknown.length > 0) return result('unsure', doubt, sourceLines);
  return result('pass', [], sourceLines);
}

/**
 * @param {HardRuleResult['verdict']} verdict
 * @param {number[]} lines
 * @param {string[]} sourceLines
 * @returns {HardRuleResult}
 */
function result(verdict, lines, sourceLines) {
  return {
    verdict,
    evidence: lines.map((line) => ({ line, text: sourceLines[line - 1] ?? '' })),
    unsureReason: verdict === 'unsure' ? 'hard_rule_unsure' : null,
    decidedBy: 'hard_rule',
  };
}

/** @param {Hit[]} hits */
function uniqueLines(hits) {
  return [...new Set(hits.map((h) => h.line))].sort((a, b) => a - b);
}

/** @param {TsNode} node */
function lineOf(node) {
  return node.startPosition.row + 1;
}

// ---------------------------------------------------------------------------
// What the file declares

/**
 * @param {TsParser} parser
 * @param {TsNode} root
 */
function describeFile(parser, root) {
  const nodes = allNodes(root);
  /** @type {Map<string, Scope[]>} */
  const userDecls = new Map();
  /** @type {Map<string, string[]>} */
  const aliases = new Map();
  /** @type {string[][]} */
  const rawDirectives = [];
  /** @type {{ name: string, line: number, node: TsNode, params: Set<string>, nodes: TsNode[] }[]} */
  const macros = [];

  for (const node of nodes) {
    if (isNameNode(node)) {
      const scope = declScope(node);
      if (scope !== undefined) {
        const list = userDecls.get(node.text) ?? [];
        list.push(scope);
        userDecls.set(node.text, list);
      }
    }
    if (node.type === 'namespace_alias_definition') {
      const name = node.childForFieldName('name');
      const target = node.namedChildren.find((c) => c && !sameNode(c, name));
      const path = target ? pathOf(target) : null;
      if (name && path) aliases.set(name.text, path.segs);
    }
    if (isUsingDirective(node)) {
      const target = node.namedChildren[0];
      const path = target ? pathOf(target) : null;
      if (path) rawDirectives.push(path.segs);
    }
    if (MACROS.has(node.type)) {
      const name = node.childForFieldName('name');
      const value = node.childForFieldName('value');
      if (!name) continue;
      const list = userDecls.get(name.text) ?? [];
      list.push(null);
      userDecls.set(name.text, list);
      if (!value) continue;
      const body = value.text.replace(/\\\r?\n/g, ' ');
      const tree = parser.parse(`${MACRO_WRAPPER}${body}\n;}\n`);
      if (!tree) continue;
      const params = new Set(
        (node.childForFieldName('parameters')?.namedChildren ?? []).flatMap((p) =>
          p ? [p.text] : [],
        ),
      );
      const aliasTarget = singlePath(tree.rootNode);
      if (aliasTarget && node.type === 'preproc_def') aliases.set(name.text, aliasTarget);
      macros.push({
        name: name.text,
        line: lineOf(node),
        node,
        params,
        nodes: allNodes(tree.rootNode),
      });
    }
  }

  const file = { nodes, userDecls, aliases, directives: /** @type {string[][]} */ ([]), macros };
  file.directives = rawDirectives.map((segs) => resolve(segs, aliases));
  return file;
}

/** @typedef {ReturnType<typeof describeFile>} FileModel */

/**
 * The namespace path an object-like macro stands for (`#define NS std`).
 * @param {TsNode} root the parsed macro wrapper
 * @returns {string[] | null}
 */
function singlePath(root) {
  const body = root.namedChildren[0]?.childForFieldName('body');
  const statements = body?.namedChildren ?? [];
  if (statements.length !== 1 || statements[0]?.type !== 'expression_statement') return null;
  const expr = statements[0].namedChildren;
  if (expr.length !== 1 || !expr[0]) return null;
  if (expr[0].type !== 'identifier' && expr[0].type !== 'qualified_identifier') return null;
  return pathOf(expr[0])?.segs ?? null;
}

/**
 * The scope a declared name lives in, or `undefined` when the node is a use.
 * @param {TsNode} node
 * @returns {Scope | undefined}
 */
function declScope(node) {
  const parent = node.parent;
  if (!parent) return undefined;
  if (parent.type === 'preproc_params') return parent.parent;
  if (MACROS.has(parent.type))
    return sameNode(parent.childForFieldName('name'), node) ? null : undefined;
  if (parent.type === 'type_parameter_declaration') return scopeAbove(parent, true);
  if (NAME_HOLDERS.has(parent.type) && sameNode(parent.childForFieldName('name'), node)) {
    return scopeAbove(parent, parent.type === 'optional_type_parameter_declaration');
  }
  if (
    TYPE_HOLDERS.has(parent.type) &&
    sameNode(parent.childForFieldName('name'), node) &&
    parent.childForFieldName('body')
  ) {
    return scopeAbove(parent, false);
  }

  /** @type {TsNode} */
  let cur = node;
  let holder = /** @type {TsNode | null} */ (parent);
  while (
    holder &&
    DECLARATOR_WRAPPERS.has(holder.type) &&
    (holder.type === 'parenthesized_declarator' ||
      sameNode(holder.childForFieldName('declarator'), cur))
  ) {
    cur = holder;
    holder = holder.parent;
  }
  if (!holder || !DECLARATOR_HOLDERS.has(holder.type)) return undefined;
  if (!holder.childrenForFieldName('declarator').some((d) => sameNode(d, cur))) return undefined;
  if (PARAMETERS.has(holder.type)) return parameterScope(holder);
  if (holder.type === 'for_range_loop') return holder;
  return scopeAbove(holder, false);
}

/**
 * @param {TsNode} node
 * @param {boolean} templateScope whether a template declaration counts (only
 *   for template parameters; a templated function is visible outside it)
 * @returns {Scope}
 */
function scopeAbove(node, templateScope) {
  let p = node.parent;
  while (p && !SCOPES.has(p.type) && !(templateScope && p.type === 'template_declaration')) {
    p = p.parent;
  }
  return !p || p.type === 'translation_unit' ? null : p;
}

/**
 * A parameter is visible in the body of its function or lambda.
 * @param {TsNode} param
 * @returns {Scope}
 */
function parameterScope(param) {
  for (let p = param.parent; p; p = p.parent) {
    if (p.type === 'function_definition' || p.type === 'lambda_expression') return p;
    if (p.type === 'declaration' || p.type === 'field_declaration') break;
  }
  return param.parent;
}

// ---------------------------------------------------------------------------
// Banned names

/**
 * @param {string} name
 * @param {FileModel} file
 * @returns {Spec}
 */
function toSpec(name, file) {
  const nodeTypes = KEYWORD_NODES[name];
  if (nodeTypes) return { kind: 'keyword', name, nodeTypes };
  const segs = name.split('::');
  if (segs.length === 1) return { kind: 'plain', name };
  /** @type {string[][]} */
  const bareForms = [];
  const add = (/** @type {string[]} */ form) => {
    if (form.length > 0 && !bareForms.some((f) => f.join('::') === form.join('::'))) {
      bareForms.push(form);
    }
  };
  // A program that compiled resolved a bare std name to std (using namespace
  // std, using std::x, or argument-dependent lookup). Only std, only one level.
  if (segs[0] === 'std') add(segs.slice(1));
  for (const dir of file.directives) {
    if (dir.length < segs.length && startsWith(segs, dir)) add(segs.slice(dir.length));
  }
  return { kind: 'qualified', name, segs, bareForms };
}

// ---------------------------------------------------------------------------
// Matching

/**
 * @param {TsNode[]} nodes
 * @param {Spec[]} specs
 * @param {FileModel} file
 * @param {{ macroParams: Set<string> | null }} ctx macroParams is set inside a macro body
 * @returns {Hit[]}
 */
function findHits(nodes, specs, file, ctx) {
  /** @type {Hit[]} */
  const hits = [];
  const inMacro = ctx.macroParams !== null;

  /**
   * @param {TsNode} node
   * @param {boolean} sure
   */
  const hit = (node, sure) => {
    const doubtful = !inMacro && (inBrokenCode(node) || inConditional(node));
    hits.push({ line: lineOf(node), sure: sure && !doubtful, node });
  };

  /**
   * A bare name: the student's own inside its declaring scope, a library name
   * when the student declared nothing by that name, unsure otherwise.
   * @param {string} name
   * @param {TsNode} use
   */
  const bare = (name, use) => {
    if (ctx.macroParams?.has(name)) return;
    const decls = file.userDecls.get(name);
    if (!decls) return hit(use, true);
    if (decls.some((s) => s === null || (!inMacro && within(use, s)))) return;
    hit(use, false);
  };

  // Loop statements and other keywords.
  for (const spec of specs) {
    if (spec.kind !== 'keyword') continue;
    for (const node of nodes) if (spec.nodeTypes.includes(node.type)) hit(node, true);
  }

  // Qualified names.
  /** @type {Set<number>} */
  const pathLeaves = new Set();
  for (const node of nodes) {
    if (node.type !== 'qualified_identifier' || node.parent?.type === 'qualified_identifier') {
      continue;
    }
    const path = pathOf(node);
    if (!path) continue;
    for (const leaf of path.leaves) pathLeaves.add(leaf.id);
    if (insideDirective(node)) continue;
    const segs = resolve(path.segs, file.aliases);
    const first = segs[0] ?? '';
    if (segs.length > 1 && first !== 'std' && file.userDecls.has(first)) continue;
    for (const spec of specs) {
      if (spec.kind === 'plain') {
        if (segs.length === 2 && first === 'std' && segs[1] === spec.name) hit(node, true);
        else if (segs.length === 1 && first === spec.name) bare(first, node);
      } else if (spec.kind === 'qualified') {
        if (startsWith(segs, spec.segs)) {
          hit(node, true);
          continue;
        }
        const form = spec.bareForms.find((f) => startsWith(segs, f));
        if (form) {
          if (form.length === 1) bare(first, node);
          else hit(node, true);
        } else if (
          first === 'std' &&
          segs.length > spec.segs.length &&
          endsWith(segs, spec.segs.slice(1))
        ) {
          hit(node, false);
        }
      }
    }
  }

  // Bare identifiers, types and member calls.
  for (const node of nodes) {
    if (pathLeaves.has(node.id)) continue;
    const isMember =
      node.type === 'field_identifier' &&
      node.parent?.type === 'field_expression' &&
      sameNode(node.parent.childForFieldName('field'), node);
    if (!isMember && node.type !== 'identifier' && node.type !== 'type_identifier') continue;
    if (node.parent?.type === 'destructor_name' || insideDirective(node)) continue;
    if (declScope(node) !== undefined) continue;
    const name = node.text;
    for (const spec of specs) {
      if (spec.kind === 'plain' && spec.name === name) {
        if (!isMember) bare(name, node);
        else if (!ctx.macroParams?.has(name)) hit(node, !file.userDecls.has(name));
      } else if (
        spec.kind === 'qualified' &&
        !isMember &&
        spec.bareForms.some((f) => f.length === 1 && f[0] === name)
      ) {
        bare(name, node);
      }
    }
  }
  return hits;
}

/**
 * A banned name inside a typedef, alias or using-declaration counts only when
 * the alias is used; the uses are evidence too. An unused one is unsure.
 * @param {Hit} hit
 * @param {FileModel} file
 * @returns {Hit[]}
 */
function widenAlias(hit, file) {
  const container = aliasContainer(hit.node);
  if (!container || !hit.sure) return [hit];
  const uses = aliasNames(container).flatMap((name) =>
    namedUses(file.nodes, name).filter((u) => !within(u, container)),
  );
  if (uses.length === 0) return [{ ...hit, sure: false }];
  return [hit, ...uses.map((u) => ({ line: lineOf(u), sure: true, node: u }))];
}

/** @param {TsNode} node */
function aliasContainer(node) {
  for (let p = node.parent; p; p = p.parent) {
    if (p.type === 'type_definition' || p.type === 'alias_declaration') return p;
    if (p.type === 'using_declaration') return isUsingDirective(p) ? null : p;
    if (SCOPES.has(p.type) || p.type === 'declaration_list') return null;
  }
  return null;
}

/** @param {TsNode} container */
function aliasNames(container) {
  if (container.type === 'alias_declaration') {
    const name = container.childForFieldName('name');
    return name ? [name.text] : [];
  }
  if (container.type === 'using_declaration') {
    const target = container.namedChildren[0];
    const last = target ? pathOf(target)?.segs.at(-1) : undefined;
    return last ? [last] : [];
  }
  return container.childrenForFieldName('declarator').flatMap((d) => {
    const leaf =
      d && allNodes(d).find((n) => n.type === 'type_identifier' || n.type === 'identifier');
    return leaf ? [leaf.text] : [];
  });
}

/**
 * Identifier or type uses of `name` that are not its own declaration.
 * @param {TsNode[]} nodes
 * @param {string} name
 */
function namedUses(nodes, name) {
  return nodes.filter(
    (n) =>
      (n.type === 'identifier' || n.type === 'type_identifier') &&
      n.text === name &&
      declScope(n) === undefined,
  );
}

// ---------------------------------------------------------------------------
// Tree helpers

/** @param {TsNode} root */
function allNodes(root) {
  /** @type {TsNode[]} */
  const out = [];
  const stack = [root];
  while (stack.length > 0) {
    const node = /** @type {TsNode} */ (stack.pop());
    out.push(node);
    for (const child of node.children) if (child) stack.push(child);
  }
  return out;
}

/**
 * @param {TsNode} node
 * @returns {{ segs: string[], leaves: TsNode[] } | null}
 */
function pathOf(node) {
  switch (node.type) {
    case 'identifier':
    case 'type_identifier':
    case 'namespace_identifier':
    case 'field_identifier':
    case 'destructor_name':
    case 'operator_name':
      return { segs: [node.text], leaves: [node] };
    case 'template_type':
    case 'template_function':
    case 'template_method': {
      const name = node.childForFieldName('name');
      return name ? pathOf(name) : null;
    }
    case 'qualified_identifier': {
      const scope = node.childForFieldName('scope');
      const name = node.childForFieldName('name');
      if (!name) return null;
      const head = scope ? pathOf(scope) : { segs: [], leaves: [] };
      const tail = pathOf(name);
      if (!head || !tail) return null;
      return { segs: [...head.segs, ...tail.segs], leaves: [...head.leaves, ...tail.leaves] };
    }
    case 'nested_namespace_specifier': {
      const parts = node.namedChildren.map((c) => (c ? pathOf(c) : null));
      if (parts.some((p) => !p)) return null;
      const ok = /** @type {{ segs: string[], leaves: TsNode[] }[]} */ (parts);
      return { segs: ok.flatMap((p) => p.segs), leaves: ok.flatMap((p) => p.leaves) };
    }
    default:
      return null;
  }
}

/**
 * Replace a leading namespace alias (`namespace S = std;`, `#define NS std`).
 * @param {string[]} segs
 * @param {Map<string, string[]>} aliases
 */
function resolve(segs, aliases) {
  let out = segs;
  for (let i = 0; i < 5; i++) {
    const target = aliases.get(out[0] ?? '');
    if (!target || out.length < 2) break;
    out = [...target, ...out.slice(1)];
  }
  return out;
}

/** @param {TsNode} node */
function isUsingDirective(node) {
  return node.type === 'using_declaration' && node.children.some((c) => c?.type === 'namespace');
}

/** @param {TsNode} node */
function insideDirective(node) {
  for (let p = node.parent; p; p = p.parent) {
    if (p.type === 'namespace_alias_definition' || isUsingDirective(p)) return true;
    if (p.type === 'using_declaration' || SCOPES.has(p.type)) return false;
  }
  return false;
}

/** @param {TsNode} node */
function inBrokenCode(node) {
  if (node.isMissing || node.hasError) return true;
  for (let p = node.parent; p; p = p.parent) {
    if (p.type === 'ERROR' || p.isMissing) return true;
    if (p.type.endsWith('_statement') || p.type === 'declaration') return p.hasError;
  }
  return false;
}

/** Code inside `#if`/`#ifdef` may never be compiled. @param {TsNode} node */
function inConditional(node) {
  for (let p = node.parent; p; p = p.parent) if (CONDITIONALS.has(p.type)) return true;
  return false;
}

/** @param {TsNode} node */
function isNameNode(node) {
  return (
    node.type === 'identifier' ||
    node.type === 'type_identifier' ||
    node.type === 'field_identifier' ||
    node.type === 'namespace_identifier'
  );
}

/**
 * @param {TsNode} node
 * @param {TsNode} scope
 */
function within(node, scope) {
  return node.startIndex >= scope.startIndex && node.endIndex <= scope.endIndex;
}

/**
 * @param {TsNode | null | undefined} a
 * @param {TsNode | null | undefined} b
 */
function sameNode(a, b) {
  return !!a && !!b && a.id === b.id;
}

/**
 * @param {string[]} segs
 * @param {string[]} prefix
 */
function startsWith(segs, prefix) {
  return prefix.length <= segs.length && prefix.every((s, i) => segs[i] === s);
}

/**
 * @param {string[]} segs
 * @param {string[]} suffix
 */
function endsWith(segs, suffix) {
  const offset = segs.length - suffix.length;
  return offset >= 0 && suffix.every((s, i) => segs[offset + i] === s);
}
