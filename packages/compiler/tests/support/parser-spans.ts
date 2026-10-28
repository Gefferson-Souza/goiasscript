import type { AstNode, ParseResult } from '../../src/ast/ast.types.ts';
import { forEachChild } from '../../src/ast/walk.ts';

// Cada diagnóstico vira `GSxxxx@início-fim` e, quando há argumentos, `{json}`.
export function spans(result: ParseResult): readonly string[] {
  return result.diagnostics.map((item) => {
    const args = Object.keys(item.args).length === 0 ? '' : JSON.stringify(item.args);
    return `${item.code}@${String(item.start)}-${String(item.end)}${args}`;
  });
}

export function collectNodes<T extends AstNode['type']>(root: AstNode, type: T): readonly Extract<AstNode, { readonly type: T }>[] {
  const found: Extract<AstNode, { readonly type: T }>[] = [];
  const visit = (node: AstNode): void => {
    if (node.type === type) found.push(node as Extract<AstNode, { readonly type: T }>);
    forEachChild(node, visit);
  };
  visit(root);
  return found;
}
