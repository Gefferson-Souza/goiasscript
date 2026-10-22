import type { AstNode } from '../ast/ast.types.ts';
import { childrenOf } from '../ast/walk.ts';

interface VisitedNode {
  readonly node: AstNode;
  readonly parent: AstNode | null;
}

const visitCache = new WeakMap<AstNode, readonly VisitedNode[]>();

function* preOrder(node: AstNode, parent: AstNode | null): Generator<VisitedNode> {
  yield { node, parent };
  for (const child of childrenOf(node)) yield* preOrder(child, node);
}

// A AST é imutável depois do parse: a ordem pré-fixada é calculada uma vez por raiz e reaproveitada pelas passadas.
function visitedNodes(root: AstNode): readonly VisitedNode[] {
  const cached = visitCache.get(root);
  if (cached !== undefined) return cached;
  const visited = Array.from(preOrder(root, null));
  visitCache.set(root, visited);
  return visited;
}

export function flatMapTree<T>(root: AstNode, select: (node: AstNode, parent: AstNode | null) => readonly T[]): readonly T[] {
  return visitedNodes(root).flatMap(({ node, parent }) => select(node, parent));
}

export function createOrderCounter(): () => number {
  let next = 0;
  return () => {
    const current = next;
    next += 1;
    return current;
  };
}
