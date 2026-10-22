import type { AstNode } from '../../src/ast/ast.types.ts';
import { forEachChild } from '../../src/ast/walk.ts';

export function toSexp(node: AstNode): string {
  if (node.type === 'Identifier') return node.name;
  if (node.type === 'Literal') return node.raw;
  const operator = 'operator' in node ? `[${node.operator}]` : '';
  const children: string[] = [];
  forEachChild(node, (child) => {
    children.push(toSexp(child));
  });
  return `${node.type}${operator}(${children.join(', ')})`;
}
