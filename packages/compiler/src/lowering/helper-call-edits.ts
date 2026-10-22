import type { StdlibEntry } from '@goiasscript/language';
import type { AstNode, CallExpression, MemberExpression } from '../ast/ast.types.ts';
import { HELPER_PREFIX } from '../helpers/helper.constants.ts';
import type { Edit, EditContext } from './edit.types.ts';
import { libraryEntryOf } from './library-edits.ts';
import { lineBreaksOf } from './line-breaks.ts';

const ARGUMENT_SEPARATOR = ',';
const ARGUMENT_PADDING = ' ';

// Sem argumentos, o ajudante vira o comparador do método nativo; com argumentos, recebe o receptor primeiro.
const passesAsCallback = (entry: StdlibEntry): boolean => entry.arity.max === 0;

function callbackEdits(call: CallExpression, callee: MemberExpression, entry: StdlibEntry, context: EditContext): readonly Edit[] {
  const original = context.source.text.slice(callee.property.start, call.end);
  const text = `${entry.js}(${HELPER_PREFIX}${entry.helperName ?? ''}${lineBreaksOf(original)})`;
  return [{ start: callee.property.start, end: call.end, text, order: context.nextOrder() }];
}

function wrapperEdits(call: CallExpression, callee: MemberExpression, entry: StdlibEntry, context: EditContext): readonly Edit[] {
  const [first] = call.arguments;
  const innerEnd = first?.start ?? call.end - 1;
  const gap = context.source.text.slice(callee.object.end, innerEnd);
  const separator = first === undefined ? '' : ARGUMENT_SEPARATOR;
  const padding = first === undefined ? '' : ARGUMENT_PADDING;
  return [
    { start: call.start, end: call.start, text: `${HELPER_PREFIX}${entry.helperName ?? ''}(`, order: context.nextOrder() },
    { start: callee.object.end, end: innerEnd, text: `${separator}${lineBreaksOf(gap)}${padding}`, order: context.nextOrder() },
  ];
}

export function helperCallEdits(node: AstNode, context: EditContext): readonly Edit[] {
  if (node.type !== 'CallExpression' || node.callee.type !== 'MemberExpression' || node.callee.computed) return [];
  const entry = libraryEntryOf(node.callee, context);
  if (entry?.kind !== 'helper' || entry.form !== 'method' || entry.receiver === 'namespace') return [];
  return passesAsCallback(entry) ? callbackEdits(node, node.callee, entry, context) : wrapperEdits(node, node.callee, entry, context);
}
