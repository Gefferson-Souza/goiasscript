import fs from 'node:fs';
import { loadDeps } from './lib/load-deps.mjs';
import { parseSource } from './lib/parse.mjs';
import { childNodes, FUNCTION_TYPES } from './lib/ast-utils.mjs';
const repo = '<repo>';
const deps = loadDeps(repo);
const [rel, fnName] = process.argv.slice(2);
const file = { rel, abs: `${repo}/${rel}`, ext: '.js' };
const { ast } = parseSource(deps.parser, fs.readFileSync(file.abs, 'utf8'), file);
let target = null;
const find = (node) => {
  if ((node.type === 'ClassMethod') && node.key.name === fnName) target = node;
  for (const c of childNodes(node)) find(c);
};
find(ast.program);
let best = { level: 0, path: [] };
const visit = (node, level, trail) => {
  const opens = (node.type === 'BlockStatement' && node !== target.body) || node.type === 'SwitchStatement';
  const cur = opens ? level + 1 : level;
  const label = opens || ['IfStatement','TryStatement','ForStatement','ForOfStatement','ArrowFunctionExpression','FunctionExpression','CatchClause'].includes(node.type) ? [`${node.type}@${node.loc.start.line}`] : [];
  const nextTrail = [...trail, ...label];
  if (cur > best.level) best = { level: cur, path: nextTrail };
  for (const c of childNodes(node)) visit(c, cur, nextTrail);
};
visit(target.body, 0, []);
process.stdout.write(`${fnName}: nível máximo de blocos=${best.level}\ncaminho: ${best.path.join(' > ')}\n`);
