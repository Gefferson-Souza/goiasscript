import type { StdlibEntry } from '@goiasscript/language';
import type { AstNode, Identifier, MemberExpression } from '../ast/ast.types.ts';
import { HELPER_PREFIX } from '../helpers/helper.constants.ts';
import type { Edit, EditContext } from './edit.types.ts';
import { lineBreaksOf } from './line-breaks.ts';

export function libraryEntryOf(node: Identifier | MemberExpression, context: EditContext): StdlibEntry | undefined {
  const resolution = context.analysis.resolutionOf(node);
  const isHostFunction = context.target === 'repl' && resolution.entry?.requiresAsync === true;
  return resolution.kind === 'library' && !isHostFunction ? resolution.entry : undefined;
}

const isNamespaceMember = (entry: StdlibEntry): boolean => entry.receiver === 'namespace';

function coveredByStaticMember(identifier: Identifier, parent: AstNode | null, context: EditContext): boolean {
  if (parent?.type !== 'MemberExpression' || parent.object !== identifier || parent.computed) return false;
  const entry = libraryEntryOf(parent, context);
  return entry !== undefined && isNamespaceMember(entry);
}

function identifierEdits(identifier: Identifier, parent: AstNode | null, context: EditContext): readonly Edit[] {
  const entry = libraryEntryOf(identifier, context);
  if (entry === undefined) return [];
  if (coveredByStaticMember(identifier, parent, context)) return [];
  return [{ start: identifier.start, end: identifier.end, text: entry.js, order: context.nextOrder() }];
}

function propertyHelperEdits(member: MemberExpression, entry: StdlibEntry, context: EditContext): readonly Edit[] {
  const gap = context.source.text.slice(member.object.end, member.end);
  return [
    { start: member.start, end: member.start, text: `${HELPER_PREFIX}${entry.helperName ?? ''}(`, order: context.nextOrder() },
    { start: member.object.end, end: member.end, text: `)${lineBreaksOf(gap)}`, order: context.nextOrder() },
  ];
}

function memberEdits(member: MemberExpression, context: EditContext): readonly Edit[] {
  const entry = libraryEntryOf(member, context);
  if (entry === undefined || member.computed) return [];
  if (isNamespaceMember(entry)) {
    const original = context.source.text.slice(member.start, member.end);
    return [{ start: member.start, end: member.end, text: `${entry.js}${lineBreaksOf(original)}`, order: context.nextOrder() }];
  }
  if (entry.kind === 'helper' && entry.form === 'property') return propertyHelperEdits(member, entry, context);
  if (entry.kind !== 'rename' && entry.kind !== 'property') return [];
  const { property } = member;
  return [{ start: property.start, end: property.end, text: entry.js, order: context.nextOrder() }];
}

export function libraryEdits(node: AstNode, parent: AstNode | null, context: EditContext): readonly Edit[] {
  if (node.type === 'Identifier') return identifierEdits(node, parent, context);
  if (node.type === 'MemberExpression') return memberEdits(node, context);
  return [];
}

export function helperNamesOf(node: AstNode, context: EditContext): readonly string[] {
  if (node.type !== 'Identifier' && node.type !== 'MemberExpression') return [];
  const entry = libraryEntryOf(node, context);
  return entry?.kind === 'helper' && entry.helperName !== undefined ? [entry.helperName] : [];
}
