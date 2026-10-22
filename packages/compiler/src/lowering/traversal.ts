import type { AstNode } from '../ast/ast.types.ts';
import { forEachChild } from '../ast/walk.ts';

interface ChildLink {
  readonly child: AstNode;
  readonly previous: ChildLink | null;
}

function* linkValues(last: ChildLink | null): Generator<AstNode> {
  for (let link = last; link !== null; link = link.previous) yield link.child;
}

// Lista encadeada: copiar um array a cada filho seria quadrático e mutar um array local é proibido aqui.
export function childrenOf(node: AstNode): readonly AstNode[] {
  let last = null as ChildLink | null;
  forEachChild(node, (child) => {
    last = { child, previous: last };
  });
  return Array.from(linkValues(last)).toReversed();
}

export function flatMapTree<T>(
  root: AstNode,
  select: (node: AstNode, parent: AstNode | null) => readonly T[],
  parent: AstNode | null = null,
): readonly T[] {
  return select(root, parent).concat(childrenOf(root).flatMap((child) => flatMapTree(child, select, root)));
}

export function createOrderCounter(): () => number {
  let next = 0;
  return () => {
    const current = next;
    next += 1;
    return current;
  };
}
