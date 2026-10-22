import type { AstNode } from '../ast/ast.types.ts';
import type { Edit, EditContext } from './edit.types.ts';

// Identificador que a biblioteca ou o construtor reescreve inteiro já nasce da tabela, em NFC.
function isRewrittenElsewhere(node: AstNode, parent: AstNode | null, context: EditContext): boolean {
  if (node.type !== 'Identifier') return false;
  if (context.analysis.resolutionOf(node).kind === 'library') return true;
  if (parent?.type === 'MethodDefinition') return parent.kind === 'constructor' && parent.key === node;
  return parent?.type === 'MemberExpression' && parent.property === node && !parent.computed && context.analysis.resolutionOf(parent).kind === 'library';
}

export function nfcEdits(node: AstNode, parent: AstNode | null, context: EditContext): readonly Edit[] {
  if (node.type !== 'Identifier' || isRewrittenElsewhere(node, parent, context)) return [];
  if (context.source.text.slice(node.start, node.end) === node.name) return [];
  return [{ start: node.start, end: node.end, text: node.name, order: context.nextOrder() }];
}
