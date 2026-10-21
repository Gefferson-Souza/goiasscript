import { propertyName, rootOfChain, snippet, startLine } from '../ast-utils.mjs';

const ARRAY_MUTATORS = new Set([
  'push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse', 'fill', 'copyWithin',
]);
const REDUCE_METHODS = new Set(['reduce', 'reduceRight']);

function chainHasCall(node) {
  let current = node;
  while (current.type === 'MemberExpression' || current.type === 'OptionalMemberExpression') {
    current = current.object;
    if (current.type === 'CallExpression' || current.type === 'OptionalCallExpression') return true;
  }
  return false;
}

function paramBindingOf(path, identifier) {
  if (identifier?.type !== 'Identifier') return null;
  const binding = path.scope.getBinding(identifier.name);
  return binding?.kind === 'param' ? binding : null;
}

// Primeiro parâmetro de callback de reduce: idiom de acumulador, marcado à parte.
function isReduceAccumulator(binding, types) {
  const fnPath = binding.scope.path;
  const parent = fnPath.parent;
  if (parent?.type !== 'CallExpression' || parent.callee.type !== 'MemberExpression') return false;
  if (!REDUCE_METHODS.has(propertyName(parent.callee))) return false;
  const first = fnPath.node.params[0];
  return Boolean(first && types.getBindingIdentifiers(first)[binding.identifier.name]);
}

function collectParamReassignments(ctx) {
  const hits = [];
  ctx.traverse(ctx.ast, {
    Function(path) {
      for (const param of path.node.params) {
        const target = param.type === 'TSParameterProperty' ? param.parameter : param;
        for (const name of Object.keys(ctx.t.getBindingIdentifiers(target))) {
          const binding = path.scope.getOwnBinding(name);
          if (binding?.kind !== 'param') continue;
          for (const violation of binding.constantViolations) {
            hits.push({ line: startLine(violation.node), name, code: snippet(ctx, violation.node) });
          }
        }
      }
    },
  });
  return hits;
}

function propertyMutation(ctx, path, root, kind) {
  const binding = paramBindingOf(path, root);
  if (!binding) return null;
  return {
    line: startLine(path.node),
    param: root.name,
    kind,
    idiom: isReduceAccumulator(binding, ctx.t) ? 'reduce-accumulator' : null,
    code: snippet(ctx, path.node),
  };
}

function collectParamPropertyMutations(ctx) {
  const hits = [];
  const push = (hit) => hit && hits.push(hit);
  const isMember = (node) => node.type === 'MemberExpression' || node.type === 'OptionalMemberExpression';
  ctx.traverse(ctx.ast, {
    AssignmentExpression(path) {
      if (isMember(path.node.left)) push(propertyMutation(ctx, path, rootOfChain(path.node.left), 'assign-prop'));
    },
    UpdateExpression(path) {
      if (isMember(path.node.argument)) push(propertyMutation(ctx, path, rootOfChain(path.node.argument), 'update-prop'));
    },
    UnaryExpression(path) {
      const { node } = path;
      if (node.operator === 'delete' && isMember(node.argument)) {
        push(propertyMutation(ctx, path, rootOfChain(node.argument), 'delete-prop'));
      }
    },
    CallExpression(path) {
      const { callee, arguments: args } = path.node;
      if (callee.type === 'MemberExpression' && ARRAY_MUTATORS.has(propertyName(callee)) && !chainHasCall(callee)) {
        push(propertyMutation(ctx, path, rootOfChain(callee.object), `mutator-${propertyName(callee)}`));
      }
      const isObjectAssign =
        callee.type === 'MemberExpression' &&
        callee.object.type === 'Identifier' &&
        callee.object.name === 'Object' &&
        propertyName(callee) === 'assign';
      if (isObjectAssign && args[0]) push(propertyMutation(ctx, path, rootOfChain(args[0]), 'object-assign'));
    },
  });
  return hits;
}

function collectDeclarations(ctx) {
  const result = { neverReassignedLet: [], reassignedLet: 0, varDeclarations: [] };
  ctx.traverse(ctx.ast, {
    VariableDeclaration(path) {
      const { node } = path;
      if (node.kind === 'var') {
        result.varDeclarations.push({ line: startLine(node), code: snippet(ctx, node) });
        return;
      }
      if (node.kind !== 'let') return;
      const isLoopHead = path.parent.type === 'ForOfStatement' || path.parent.type === 'ForInStatement';
      for (const declarator of node.declarations) {
        for (const name of Object.keys(ctx.t.getBindingIdentifiers(declarator.id))) {
          const binding = path.scope.getBinding(name);
          if (!binding) continue;
          if (binding.constantViolations.length > 0) {
            result.reassignedLet += 1;
          } else if (declarator.init || isLoopHead) {
            result.neverReassignedLet.push({ line: startLine(declarator), name, code: snippet(ctx, declarator) });
          }
        }
      }
    },
  });
  return result;
}

export function analyzeMutation(ctx) {
  const propertyMutations = collectParamPropertyMutations(ctx);
  return {
    paramReassignments: collectParamReassignments(ctx),
    paramPropertyMutations: propertyMutations,
    ...collectDeclarations(ctx),
  };
}
