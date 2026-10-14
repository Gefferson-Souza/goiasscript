import { isInsideType, isUpperSnake, keyName, propertyName, snippet, startLine } from '../ast-utils.mjs';

const IGNORED_NUMBERS = new Set([-1, 0, 1, 2]);
const RADIX_VALUES = new Set([2, 8, 10, 16, 36]);
const MIN_STRING_LENGTH = 3;
const REPEAT_THRESHOLD = 3;
const NOMINAL_KEYS = new Set([
  'type', 'kind', 'status', 'mode', 'state', 'level', 'phase', 'role', 'event', 'action', 'variant',
]);
const COMPARISON_OPERATORS = new Set(['==', '===', '!=', '!==']);
const MAX_NOMINAL_WORDS = 3;
const SENTENCE_PUNCTUATION = /[.!?…—]\s|[\u{1F300}-\u{1FAFF}]/u;
const PLACEHOLDER_SPEC = /[<>{}[\]]/;

// Texto de interface (frase) e especificação de placeholder não são valor nominal.
function isProseOrSpec(value) {
  const words = value.trim().split(/\s+/).length;
  return words > MAX_NOMINAL_WORDS || SENTENCE_PUNCTUATION.test(value) || PLACEHOLDER_SPEC.test(value);
}

function isNamedConstantContext(path) {
  return Boolean(
    path.findParent((parent) => {
      if (parent.isVariableDeclarator()) {
        return parent.node.id.type === 'Identifier' && isUpperSnake(parent.node.id.name);
      }
      if (parent.isTSAsExpression()) {
        const target = parent.node.typeAnnotation;
        return target.type === 'TSTypeReference' && target.typeName?.name === 'const';
      }
      return false;
    }),
  );
}

function isRadixArgument(path, value) {
  const { parent, node } = path;
  if (parent.type !== 'CallExpression' || !RADIX_VALUES.has(value)) return false;
  const calleeName =
    parent.callee.type === 'Identifier' ? parent.callee.name : (propertyName(parent.callee) ?? '');
  if (calleeName === 'parseInt') return parent.arguments[1] === node;
  return calleeName === 'toString' && parent.arguments[0] === node;
}

function contextOf(path) {
  const { parent } = path;
  if (parent.type === 'JSXExpressionContainer') return 'jsx-attr';
  if (parent.type === 'AssignmentPattern') return 'default-param';
  if (parent.type === 'ObjectProperty') return `property:${keyName(parent.key, parent.computed) ?? '?'}`;
  if (parent.type === 'CallExpression' || parent.type === 'NewExpression') return 'call-arg';
  if (parent.type === 'BinaryExpression' || parent.type === 'LogicalExpression') return `operand:${parent.operator}`;
  if (parent.type === 'ReturnStatement') return 'return';
  if (parent.type === 'ArrayExpression') return 'array-element';
  if (parent.type === 'VariableDeclarator') return 'variable-init';
  if (parent.type === 'SwitchCase') return 'case';
  return parent.type;
}

function signedValue(path) {
  const { node, parent } = path;
  if (parent.type === 'UnaryExpression' && parent.operator === '-' && parent.argument === node) {
    return { value: -node.value, outer: path.parentPath };
  }
  return { value: node.value, outer: path };
}

export function analyzeMagicNumbers(ctx) {
  const hits = [];
  if (ctx.isTest) return hits;
  ctx.traverse(ctx.ast, {
    NumericLiteral(path) {
      const { value, outer } = signedValue(path);
      if (IGNORED_NUMBERS.has(value) || isInsideType(path)) return;
      if (outer.parent.type === 'TSEnumMember' || isNamedConstantContext(path)) return;
      if (outer.parent.type === 'MemberExpression' && outer.parent.computed && outer.parent.property === outer.node) return;
      if (isRadixArgument(outer, value)) return;
      hits.push({ line: startLine(path.node), value, context: contextOf(outer), code: snippet(ctx, outer.parent) });
    },
  });
  return hits;
}

function isIgnoredStringPosition(path) {
  const { node, parent } = path;
  const keyedParents = ['ObjectProperty', 'ObjectMethod', 'ClassMethod', 'ClassProperty'];
  if (keyedParents.includes(parent.type) && parent.key === node) return true;
  const sourceParents = ['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration', 'TSExternalModuleReference'];
  if (sourceParents.includes(parent.type) || parent.type === 'JSXAttribute') return true;
  if (parent.type === 'CallExpression' && (parent.callee.type === 'Import' || parent.callee.name === 'require')) return true;
  return isInsideType(path) || parent.type === 'TSLiteralType';
}

function isNominalPosition(path) {
  const { node, parent } = path;
  if (parent.type === 'BinaryExpression') return COMPARISON_OPERATORS.has(parent.operator);
  if (parent.type === 'SwitchCase') return parent.test === node;
  if (parent.type === 'ObjectProperty' && parent.value === node) return NOMINAL_KEYS.has(keyName(parent.key, parent.computed));
  return false;
}

export function analyzeMagicStrings(ctx) {
  if (ctx.isTest) return { repeated: [], nominalSites: 0 };
  const occurrences = new Map();
  let nominalSites = 0;
  ctx.traverse(ctx.ast, {
    StringLiteral(path) {
      const { value } = path.node;
      if (value.length < MIN_STRING_LENGTH || !/\p{L}/u.test(value) || isProseOrSpec(value)) return;
      if (isIgnoredStringPosition(path)) return;
      const nominal = isNominalPosition(path);
      if (nominal) nominalSites += 1;
      // Em TypeScript, literal comparado ou valor de chave discriminante costuma pertencer a uma união tipada.
      if (nominal && ctx.isTs) return;
      const entry = occurrences.get(value) ?? { lines: [], nominal: 0 };
      entry.lines.push(startLine(path.node));
      if (nominal) entry.nominal += 1;
      occurrences.set(value, entry);
    },
  });
  const repeated = [...occurrences.entries()]
    .filter(([, entry]) => entry.lines.length >= REPEAT_THRESHOLD)
    .map(([value, entry]) => ({ value: value.slice(0, 60), count: entry.lines.length, nominal: entry.nominal, lines: entry.lines }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
  return { repeated, nominalSites };
}
