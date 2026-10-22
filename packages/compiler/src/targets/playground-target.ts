import type { AstNode } from '../ast/ast.types.ts';
import { HELPER_PREFIX, TICK_HELPER } from '../helpers/helper.constants.ts';
import type { Edit, EditContext } from '../lowering/edit.types.ts';
import { flatMapTree } from '../lowering/traversal.ts';
import { positionAt } from '../source/source-text.ts';

export const STRICT_DIRECTIVE = "'use strict'; ";

function tickEdits(node: AstNode, context: EditContext): readonly Edit[] {
  const isLoop = node.type === 'WhileStatement' || node.type === 'ForStatement' || node.type === 'ForOfStatement' || node.type === 'ForInStatement';
  if (!isLoop) return [];
  const { line } = positionAt(context.source, node.start);
  const afterBrace = node.body.start + 1;
  return [{ start: afterBrace, end: afterBrace, text: ` ${HELPER_PREFIX}${TICK_HELPER}(${String(line)});`, order: context.nextOrder() }];
}

export const strictDirectiveEdit = (context: EditContext): Edit => ({ start: 0, end: 0, text: STRICT_DIRECTIVE, order: context.nextOrder() });

export const loopGuardEdits = (program: AstNode, context: EditContext): readonly Edit[] => flatMapTree(program, (node) => tickEdits(node, context));
