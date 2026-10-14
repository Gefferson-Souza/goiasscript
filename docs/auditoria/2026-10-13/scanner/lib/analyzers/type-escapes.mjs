import { propertyName, snippet, startLine } from '../ast-utils.mjs';

function classifyAny(parentType) {
  if (parentType === 'TSAsExpression' || parentType === 'TSTypeAssertion') return 'cast';
  if (parentType === 'TSTypeAnnotation') return 'annotation';
  if (parentType === 'TSTypeParameterInstantiation') return 'generic-arg';
  if (parentType === 'TSArrayType') return 'array';
  return 'other';
}

function isConstAssertion(node) {
  const target = node.typeAnnotation;
  return target?.type === 'TSTypeReference' && target.typeName?.name === 'const';
}

export function analyzeTypeEscapes(ctx) {
  const escapes = { any: [], nonNull: [], doubleCast: [], cast: [] };
  if (!ctx.isTs) return escapes;
  ctx.traverse(ctx.ast, {
    TSAnyKeyword(path) {
      escapes.any.push({ line: startLine(path.node), kind: classifyAny(path.parent.type), code: snippet(ctx, path.parent) });
    },
    TSNonNullExpression(path) {
      escapes.nonNull.push({ line: startLine(path.node), code: snippet(ctx, path.node) });
    },
    TSAsExpression(path) {
      const { node } = path;
      if (isConstAssertion(node)) return;
      const inner = node.expression;
      const isDouble = inner.type === 'TSAsExpression' && inner.typeAnnotation.type === 'TSUnknownKeyword';
      const bucket = isDouble ? escapes.doubleCast : escapes.cast;
      bucket.push({ line: startLine(node), code: snippet(ctx, node) });
    },
  });
  return escapes;
}

export function analyzeConsole(ctx) {
  const calls = [];
  ctx.traverse(ctx.ast, {
    MemberExpression(path) {
      const { node } = path;
      if (node.object.type !== 'Identifier' || node.object.name !== 'console') return;
      if (path.scope.getBinding('console')) return;
      calls.push({ line: startLine(node), method: propertyName(node) ?? '[computed]', code: snippet(ctx, path.parent) });
    },
  });
  return calls;
}
