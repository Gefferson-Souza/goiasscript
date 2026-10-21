import { FUNCTION_TYPES, childNodes } from '../ast-utils.mjs';

// Mesma semântica da regra max-depth do ESLint: instruções de controle aninhadas,
// recomeçando em cada função; "else if" não conta como um nível a mais.
const DEPTH_NODES = new Set([
  'IfStatement',
  'SwitchStatement',
  'TryStatement',
  'DoWhileStatement',
  'WhileStatement',
  'WithStatement',
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
]);

function isElseIf(node, parent) {
  return node.type === 'IfStatement' && parent?.type === 'IfStatement' && parent.alternate === node;
}

export function controlDepth(rootNode) {
  let max = 0;
  let maxLine = rootNode.loc?.start.line ?? 0;
  const visit = (node, depth, parent) => {
    if (FUNCTION_TYPES.has(node.type) && node !== rootNode) return;
    let current = depth;
    if (DEPTH_NODES.has(node.type) && !isElseIf(node, parent)) {
      current += 1;
      if (current > max) {
        max = current;
        maxLine = node.loc.start.line;
      }
    }
    for (const child of childNodes(node)) visit(child, current, node);
  };
  visit(rootNode, 0, null);
  return { max, line: maxLine };
}

// Níveis de chaves aninhadas dentro da função, somando closures internas (o bloco do
// corpo da própria função não conta). É o recuo que quem lê enxerga.
export function blockNesting(functionNode) {
  let max = 0;
  const visit = (node, level) => {
    const opensBlock = (node.type === 'BlockStatement' && node !== functionNode.body) || node.type === 'SwitchStatement';
    const current = opensBlock ? level + 1 : level;
    if (current > max) max = current;
    for (const child of childNodes(node)) visit(child, current);
  };
  visit(functionNode.body, 0);
  return max;
}

export function analyzeProgramDepth(ctx) {
  return controlDepth(ctx.ast.program);
}
