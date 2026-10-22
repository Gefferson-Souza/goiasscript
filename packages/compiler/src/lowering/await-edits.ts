import type { AstNode, CallExpression } from '../ast/ast.types.ts';
import type { Edit, EditContext } from './edit.types.ts';

const isMemberObject = (parent: AstNode, call: CallExpression): boolean => parent.type === 'MemberExpression' && parent.object === call;
const isCallee = (parent: AstNode, call: CallExpression): boolean =>
  (parent.type === 'CallExpression' || parent.type === 'NewExpression') && parent.callee === call;

export function isAskCall(call: CallExpression, context: EditContext): boolean {
  if (call.callee.type !== 'Identifier') return false;
  const resolution = context.analysis.resolutionOf(call.callee);
  return resolution.kind === 'library' && resolution.entry?.requiresAsync === true;
}

// `await` tem precedência menor que membro, índice e chamada: nesses contextos a expressão vai entre parênteses.
export function awaitEdits(call: CallExpression, parent: AstNode, nextOrder: () => number): readonly Edit[] {
  const wrapped = isMemberObject(parent, call) || isCallee(parent, call);
  const opening: Edit = { start: call.start, end: call.start, text: wrapped ? '(await ' : 'await ', order: nextOrder() };
  return wrapped ? [opening, { start: call.end, end: call.end, text: ')', order: nextOrder() }] : [opening];
}

export function askAwaitEdits(node: AstNode, parent: AstNode | null, context: EditContext): readonly Edit[] {
  if (node.type !== 'CallExpression' || parent === null || parent.type === 'AwaitExpression') return [];
  return isAskCall(node, context) ? awaitEdits(node, parent, context.nextOrder) : [];
}
