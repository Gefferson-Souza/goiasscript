import { calleeRootName, endLine, keyName, propertyName, snippet, startLine } from '../ast-utils.mjs';
import { countKindsInRange } from './size.mjs';
import { blockNesting, controlDepth } from './depth.mjs';

const CONTAINER_ROOTS = new Set(['describe', 'context', 'suite']);

function callbackOwner(parent) {
  const callee = parent.callee;
  if (callee.type === 'Identifier') return callee.name;
  if (callee.type === 'MemberExpression') {
    const method = propertyName(callee);
    const root = calleeRootName(callee);
    return root && method ? `${root}.${method}` : (method ?? root ?? 'chamada');
  }
  return calleeRootName(callee) ?? 'chamada';
}

function inferName(path, ctx) {
  const { node, parent } = path;
  if (node.id?.name) return node.id.name;
  if (node.key) return keyName(node.key, node.computed) ?? '[computed]';
  if (parent.type === 'VariableDeclarator' && parent.id.type === 'Identifier') return parent.id.name;
  if (parent.type === 'AssignmentExpression') return snippet(ctx, parent.left, 60);
  if (parent.type === 'ObjectProperty' || parent.type === 'ClassProperty') {
    return keyName(parent.key, parent.computed) ?? '[computed]';
  }
  if (parent.type === 'CallExpression' && parent.arguments.includes(node)) {
    return `callback(${callbackOwner(parent)})`;
  }
  if (parent.type === 'ExportDefaultDeclaration') return 'default';
  return '(anônima)';
}

function inferKind(node) {
  if (node.type === 'ArrowFunctionExpression') return 'arrow';
  if (node.kind === 'constructor') return 'constructor';
  if (node.kind === 'get' || node.kind === 'set') return 'accessor';
  if (node.type === 'ClassMethod' || node.type === 'ClassPrivateMethod' || node.type === 'ObjectMethod') {
    return 'method';
  }
  return 'function';
}

function isTestContainer(path) {
  const { node, parent } = path;
  if (parent.type !== 'CallExpression' || !parent.arguments.includes(node)) return false;
  if (node.type !== 'ArrowFunctionExpression' && node.type !== 'FunctionExpression') return false;
  const root = calleeRootName(parent.callee);
  if (root && CONTAINER_ROOTS.has(root)) return true;
  return parent.callee.type === 'MemberExpression' && propertyName(parent.callee) === 'describe';
}

// Linhas ocupadas por JSX e por literais de template multilinha dentro da função.
function measureEmbedded(path) {
  const measure = { jsxLines: 0, templateLines: 0 };
  path.traverse({
    JSXElement(inner) {
      measure.jsxLines += endLine(inner.node) - startLine(inner.node) + 1;
      inner.skip();
    },
    JSXFragment(inner) {
      measure.jsxLines += endLine(inner.node) - startLine(inner.node) + 1;
      inner.skip();
    },
    TemplateLiteral(inner) {
      measure.templateLines += endLine(inner.node) - startLine(inner.node);
      inner.skip();
    },
  });
  return measure;
}

function describeFunction(path, ctx) {
  const { node } = path;
  const from = startLine(node);
  const to = endLine(node);
  const embedded = measureEmbedded(path);
  const depth = controlDepth(node);
  const container = isTestContainer(path);
  return {
    name: inferName(path, ctx),
    kind: inferKind(node),
    line: from,
    endLine: to,
    lines: to - from + 1,
    codeLines: countKindsInRange(ctx, from, to, 'code'),
    jsxLines: embedded.jsxLines,
    templateLines: embedded.templateLines,
    params: node.params.length,
    isAsync: Boolean(node.async),
    testContainer: container,
    maxDepth: depth.max,
    maxDepthLine: depth.line,
    blockNesting: blockNesting(node),
    outermost: !path.findParent((parent) => parent.isFunction()),
  };
}

export function analyzeFunctions(ctx) {
  const functions = [];
  ctx.traverse(ctx.ast, {
    Function(path) {
      if (!path.node.loc || !path.node.body) return;
      functions.push(describeFunction(path, ctx));
    },
  });
  functions.sort((a, b) => a.line - b.line || a.endLine - b.endLine);
  return functions;
}
