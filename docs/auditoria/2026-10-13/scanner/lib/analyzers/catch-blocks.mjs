import { FUNCTION_TYPES, calleeRootName, childNodes, propertyName, snippet, startLine } from '../ast-utils.mjs';

const LOGGER_ROOTS = new Set(['console', 'logger', 'log', 'Logger']);
const EXIT_METHODS = new Set(['exit', 'abort', 'reject']);

function isLoggingStatement(statement) {
  if (statement.type !== 'ExpressionStatement') return false;
  const expression = statement.expression;
  if (expression.type !== 'CallExpression') return false;
  const root = calleeRootName(expression.callee);
  if (root && LOGGER_ROOTS.has(root)) return true;
  return root === 'process' && /^process\.std(?:err|out)/.test(snippetOfCallee(expression.callee));
}

function snippetOfCallee(callee) {
  const parts = [];
  let current = callee;
  while (current.type === 'MemberExpression') {
    parts.unshift(propertyName(current) ?? '?');
    current = current.object;
  }
  if (current.type === 'Identifier') parts.unshift(current.name);
  return parts.join('.');
}

// Há throw/return/exit/reject alcançável no bloco (sem entrar em funções aninhadas).
function exitsOrRethrows(block) {
  const visit = (node) => {
    if (FUNCTION_TYPES.has(node.type)) return false;
    if (node.type === 'ThrowStatement' || node.type === 'ReturnStatement') return true;
    if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression') {
      if (EXIT_METHODS.has(propertyName(node.callee))) return true;
    }
    if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && EXIT_METHODS.has(node.callee.name)) {
      return true;
    }
    for (const child of childNodes(node)) {
      if (visit(child)) return true;
    }
    return false;
  };
  return visit(block);
}

function classifyCatch(path, ctx) {
  const { node } = path;
  const statements = node.body.body;
  const leaves = exitsOrRethrows(node.body);
  const hasComment = ctx.comments.some((c) => c.start > node.body.start && c.end < node.body.end);
  let swallow = null;
  if (statements.length === 0) swallow = hasComment ? 'empty-with-comment' : 'empty';
  else if (!leaves && statements.every(isLoggingStatement)) swallow = 'log-only';
  const paramName = node.param?.type === 'Identifier' ? node.param.name : null;
  const binding = paramName ? path.scope.getBinding(paramName) : null;
  const usesError = Boolean(binding && binding.referencePaths.length > 0);
  return { swallow, discardsError: !usesError && !hasThrow(node.body) && statements.length > 0 };
}

function hasThrow(block) {
  const visit = (node) => {
    if (FUNCTION_TYPES.has(node.type)) return false;
    if (node.type === 'ThrowStatement') return true;
    return [...childNodes(node)].some(visit);
  };
  return visit(block);
}

function isEmptyHandler(handler) {
  if (!handler || !FUNCTION_TYPES.has(handler.type)) return false;
  if (handler.body.type === 'BlockStatement') return handler.body.body.length === 0;
  const body = handler.body;
  return body.type === 'NullLiteral' || (body.type === 'Identifier' && body.name === 'undefined');
}

export function analyzeCatchBlocks(ctx) {
  const swallowed = [];
  const discarding = [];
  ctx.traverse(ctx.ast, {
    CatchClause(path) {
      const { swallow, discardsError } = classifyCatch(path, ctx);
      const entry = { line: startLine(path.node), code: snippet(ctx, path.node.body, 90) };
      if (swallow) swallowed.push({ ...entry, kind: swallow });
      else if (discardsError) discarding.push(entry);
    },
    CallExpression(path) {
      const { callee, arguments: args } = path.node;
      if (callee.type !== 'MemberExpression' || propertyName(callee) !== 'catch') return;
      if (isEmptyHandler(args[0])) {
        swallowed.push({ line: startLine(path.node), kind: 'promise-catch-vazio', code: snippet(ctx, path.node, 90) });
      }
    },
  });
  return { swallowed, discarding };
}
