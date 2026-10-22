import type { AstNode } from '../ast/ast.types.ts';
import { forEachChild } from '../ast/walk.ts';
import { FUNCTION_TYPES, LOOP_TYPES } from './hint-checks.constants.ts';

// Há saída própria do laço? `para_com_isso` de laço interno e o que está em função aninhada não contam.
export function hasLoopExit(node: AstNode, insideNestedLoop = false): boolean {
  if (FUNCTION_TYPES.has(node.type)) return false;
  if (node.type === 'ReturnStatement' || node.type === 'ThrowStatement') return true;
  if (node.type === 'BreakStatement') return !insideNestedLoop;
  const nested = insideNestedLoop || LOOP_TYPES.has(node.type);
  let found = false;
  forEachChild(node, (child) => {
    found ||= hasLoopExit(child, nested);
  });
  return found;
}
