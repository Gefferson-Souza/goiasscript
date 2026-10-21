import { FUNCTION_TYPES, keyName, propertyName, startLine } from '../ast-utils.mjs';

const MEMBER_NODE_TYPES = [
  'ClassMethod', 'ClassPrivateMethod', 'ClassProperty', 'ClassPrivateProperty', 'ClassAccessorProperty',
  'TSDeclareMethod',
];

function bindingNames(ctx, pattern) {
  const target = pattern.type === 'TSParameterProperty' ? pattern.parameter : pattern;
  return Object.entries(ctx.t.getBindingIdentifiers(target));
}

function isPrototypeMember(node) {
  return node.type === 'MemberExpression' && propertyName(node) === 'prototype';
}

function isExportsObject(node) {
  if (node.type === 'Identifier') return node.name === 'exports';
  return node.type === 'MemberExpression' && node.object.name === 'module' && propertyName(node) === 'exports';
}

export function collectDeclared(ctx) {
  const declared = [];
  const seenFields = new Set();
  const offset = ctx.lineOffset ?? 0;
  const add = (name, node, kind, position = 'internal') => {
    if (name) declared.push({ name, line: startLine(node) + offset, kind, position });
  };
  const topLevelApi = (path) => (ctx.embedded && path.parentPath.isProgram() ? 'api' : 'internal');
  ctx.traverse(ctx.ast, {
    VariableDeclarator(path) {
      const isFunction = path.node.init && FUNCTION_TYPES.has(path.node.init.type);
      const position = ctx.embedded && path.parentPath.parentPath?.isProgram() ? 'api' : 'internal';
      for (const [name, id] of bindingNames(ctx, path.node.id)) add(name, id, isFunction ? 'function' : 'variable', position);
    },
    Function(path) {
      const { node } = path;
      if (node.id) add(node.id.name, node.id, 'function', topLevelApi(path));
      for (const param of node.params) {
        for (const [name, id] of bindingNames(ctx, param)) add(name, id, 'param');
      }
    },
    CatchClause(path) {
      if (path.node.param) for (const [name, id] of bindingNames(ctx, path.node.param)) add(name, id, 'param');
    },
    'ClassDeclaration|ClassExpression'(path) {
      if (path.node.id) add(path.node.id.name, path.node.id, 'class');
    },
    [MEMBER_NODE_TYPES.join('|')](path) {
      const name = keyName(path.node.key, path.node.computed);
      if (!name || name === 'constructor') return;
      add(name.replace(/^#/, ''), path.node.key, path.node.type.includes('Method') ? 'method' : 'property');
    },
    'ObjectProperty|ObjectMethod'(path) {
      const { node, parent } = path;
      if (parent.type !== 'ObjectExpression' || node.computed || node.shorthand) return;
      if (node.key.type === 'Identifier') add(node.key.name, node.key, 'object-key', 'api');
    },
    'ImportSpecifier|ImportDefaultSpecifier|ImportNamespaceSpecifier'(path) {
      const { node } = path;
      const aliased = node.type !== 'ImportSpecifier' || node.imported.name !== node.local.name;
      if (aliased) add(node.local.name, node.local, 'import');
    },
    'TSTypeAliasDeclaration|TSInterfaceDeclaration|TSEnumDeclaration|TSModuleDeclaration'(path) {
      if (path.node.id?.type === 'Identifier') add(path.node.id.name, path.node.id, 'type');
    },
    TSEnumMember(path) {
      if (path.node.id.type === 'Identifier') add(path.node.id.name, path.node.id, 'enum-member');
    },
    'TSPropertySignature|TSMethodSignature'(path) {
      if (!path.node.computed && path.node.key.type === 'Identifier') add(path.node.key.name, path.node.key, 'property');
    },
    TSTypeParameter(path) {
      add(typeof path.node.name === 'string' ? path.node.name : path.node.name?.name, path.node, 'type-param');
    },
    AssignmentExpression(path) {
      const { left } = path.node;
      if (left.type !== 'MemberExpression' || left.computed || left.property.type !== 'Identifier') return;
      const { object, property } = left;
      if (object.type === 'ThisExpression') {
        if (!seenFields.has(property.name)) add(property.name, property, 'field');
        seenFields.add(property.name);
      } else if (isPrototypeMember(object) || isExportsObject(object)) {
        add(property.name, property, 'member-def', 'api');
      } else if (ctx.embedded && object.type === 'Identifier') {
        add(property.name, property, 'member-def', 'api');
      }
    },
  });
  return declared;
}

// A superfície da linguagem vive só em valores string das tabelas; nunca isenta identificador.
function classifySurface() {
  return 'internal';
}

export function analyzeIdentifiers(ctx, lexicon, surface) {
  const declared = collectDeclared(ctx);
  const items = [];
  for (const entry of declared) {
    const analysis = lexicon.analyzeName(entry.name);
    if (!analysis.tier) continue;
    items.push({
      name: entry.name,
      line: entry.line,
      kind: entry.kind,
      tier: analysis.tier,
      ptTokens: analysis.ptTokens,
      surface: classifySurface(entry, ctx, surface),
      embedded: Boolean(ctx.embedded),
    });
  }
  return { declaredTotal: declared.length, items };
}
