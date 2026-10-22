import type { StdlibEntry } from '@goiasscript/language';
import type { AstNode, CallExpression, MemberExpression, ThrowStatement } from '../ast/ast.types.ts';
import type { Edit, EditContext } from './edit.types.ts';
import { libraryEntryOf } from './library-edits.ts';
import { lineBreaksOf } from './line-breaks.ts';

const THROW_KEYWORD = 'throw';
const THROW_NEW_ERROR = 'throw new Error';
const MONTH_GETTER = 'getMonth';
const OBJECT_MERGE = 'Object.assign';
const EMPTY_TARGET = '{}, ';

// `vixe(faz_um Erro(...))` e o relançamento mantêm os parênteses do aluno; texto vira `new Error(texto)`.
function throwEdits(node: ThrowStatement, context: EditContext): readonly Edit[] {
  const [only] = node.arguments;
  const keepsError = node.arguments.length === 1 && (only?.type === 'NewExpression' || context.analysis.rethrowStatements.has(node));
  const text = keepsError ? `${THROW_KEYWORD} ` : THROW_NEW_ERROR;
  return [{ start: node.keywordToken.start, end: node.keywordToken.end, text, order: context.nextOrder() }];
}

// A soma não é atômica: `(` antes do receptor e `.mês()` inteiro vira `.getMonth() + 1)`.
function monthEdits(call: CallExpression, callee: MemberExpression, context: EditContext): readonly Edit[] {
  const original = context.source.text.slice(callee.property.start, call.end);
  return [
    { start: call.start, end: call.start, text: '(', order: context.nextOrder() },
    { start: callee.property.start, end: call.end, text: `${MONTH_GETTER}() + 1)${lineBreaksOf(original)}`, order: context.nextOrder() },
  ];
}

function mergeEdits(call: CallExpression, context: EditContext): readonly Edit[] {
  const [first] = call.arguments;
  return first === undefined ? [] : [{ start: first.start, end: first.start, text: EMPTY_TARGET, order: context.nextOrder() }];
}

function callMacroEdits(call: CallExpression, entry: StdlibEntry, callee: MemberExpression, context: EditContext): readonly Edit[] {
  if (entry.js === MONTH_GETTER) return monthEdits(call, callee, context);
  return entry.js === OBJECT_MERGE ? mergeEdits(call, context) : [];
}

export function macroEdits(node: AstNode, _parent: AstNode | null, context: EditContext): readonly Edit[] {
  if (node.type === 'ThrowStatement') return throwEdits(node, context);
  if (node.type !== 'CallExpression' || node.callee.type !== 'MemberExpression' || node.callee.computed) return [];
  const entry = libraryEntryOf(node.callee, context);
  return entry?.kind === 'macro' ? callMacroEdits(node, entry, node.callee, context) : [];
}
