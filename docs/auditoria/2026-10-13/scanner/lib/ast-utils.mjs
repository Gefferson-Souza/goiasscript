export const FUNCTION_TYPES = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
  'ObjectMethod',
  'ClassMethod',
  'ClassPrivateMethod',
]);

const SKIPPED_KEYS = new Set([
  'loc', 'start', 'end', 'type', 'leadingComments', 'trailingComments', 'innerComments', 'extra',
  'range', 'errors', 'comments',
]);

export function* childNodes(node) {
  for (const key of Object.keys(node)) {
    if (SKIPPED_KEYS.has(key)) continue;
    const value = node[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item.type === 'string') yield item;
      }
    } else if (value && typeof value.type === 'string') {
      yield value;
    }
  }
}

export function keyName(key, computed = false) {
  if (!key || computed) return null;
  if (key.type === 'Identifier') return key.name;
  if (key.type === 'StringLiteral') return key.value;
  if (key.type === 'NumericLiteral') return String(key.value);
  if (key.type === 'PrivateName') return `#${key.id.name}`;
  return null;
}

export function propertyName(member) {
  if (member.computed) {
    return member.property.type === 'StringLiteral' ? member.property.value : null;
  }
  return member.property.type === 'Identifier' ? member.property.name : null;
}

// Identificador na raiz de uma cadeia a.b.c, a[b], a().b ou a!.b.
export function rootOfChain(node) {
  let current = node;
  for (;;) {
    if (current.type === 'MemberExpression' || current.type === 'OptionalMemberExpression') {
      current = current.object;
    } else if (current.type === 'CallExpression' || current.type === 'OptionalCallExpression') {
      current = current.callee;
    } else if (current.type === 'TSNonNullExpression' || current.type === 'TSAsExpression') {
      current = current.expression;
    } else {
      return current;
    }
  }
}

export function calleeRootName(callee) {
  const root = rootOfChain(callee);
  return root.type === 'Identifier' ? root.name : null;
}

export function snippet(ctx, node, max = 70) {
  const raw = ctx.text.slice(node.start, node.end).replace(/\s+/g, ' ').trim();
  return raw.length > max ? `${raw.slice(0, max - 1)}…` : raw;
}

export function startLine(node) {
  return node.loc.start.line;
}

export function endLine(node) {
  return node.loc.end.line;
}

export function isInsideType(path) {
  return Boolean(
    path.findParent(
      (parent) =>
        parent.isTSType() ||
        parent.isTSTypeAnnotation() ||
        parent.isTSTypeParameterInstantiation() ||
        parent.isTSInterfaceDeclaration() ||
        parent.isTSTypeAliasDeclaration() ||
        parent.isTSEnumDeclaration(),
    ),
  );
}

export function isUpperSnake(name) {
  return /^[A-Z][A-Z0-9_]*$/.test(name);
}
