import type { Program } from './ast.types.ts';
import type { Token } from './token.types.ts';
import { BYTE_ORDER_MARK, LIBRARY_GLOBALS, LIBRARY_MEMBERS, THROW_PLAIN, THROW_WRAPPED } from './vocabulary.constants.ts';

export interface Edit { readonly start: number; readonly end: number; readonly text: string; readonly order: number }

type RawEdit = Omit<Edit, 'order'>;
interface Visitable { readonly type: string; readonly start: number; readonly end: number; readonly [key: string]: unknown }

const MERGING_PAIRS: ReadonlySet<string> = new Set(['++', '--', '//', '/*', '+=', '-=', '*=', '/=', '%=', '<=', '>=', '==', '=>', '**', '&&', '||']);
const TOKEN_SUFFIX = 'Token';

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null;
}

function isNode(value: unknown): value is Visitable {
  return isRecord(value) && typeof value['type'] === 'string' && typeof value['start'] === 'number' && typeof value['end'] === 'number';
}

function isKeywordToken(value: unknown): value is Token {
  return isRecord(value) && value['kind'] === 'keyword';
}

function replaceKeyword(node: Visitable, token: Token): RawEdit {
  if (node.type !== 'ThrowStatement') return { start: token.start, end: token.end, text: token.keyword?.js ?? token.text };
  return { start: token.start, end: token.end, text: node['wrapsInError'] === true ? THROW_WRAPPED : THROW_PLAIN };
}

function specialEdits(node: Visitable): readonly RawEdit[] {
  const terminator: readonly RawEdit[] = node['needsTerminator'] === true ? [{ start: node.end, end: node.end, text: ';' }] : [];
  if (node.type === 'Identifier' && node['reference'] === true) {
    const replacement = LIBRARY_GLOBALS.get(String(node['name']));
    return replacement === undefined ? terminator : [{ start: node.start, end: node.end, text: replacement }];
  }
  const property = node['property'];
  if (node.type === 'MemberExpression' && node['computed'] === false && isNode(property) && property.type === 'PropertyName') {
    const replacement = LIBRARY_MEMBERS.get(String(property['name']));
    if (replacement !== undefined) return [{ start: property.start, end: property.end, text: replacement }];
  }
  return terminator;
}

function collect(value: unknown): readonly RawEdit[] {
  if (Array.isArray(value)) return value.flatMap(collect);
  if (!isNode(value)) return [];
  const children = Object.entries(value).flatMap(([key, child]) =>
    key.endsWith(TOKEN_SUFFIX) && isKeywordToken(child) ? [replaceKeyword(value, child)] : collect(child),
  );
  return [...children, ...specialEdits(value)];
}

export function lower(program: Program, text: string): readonly Edit[] {
  const bom: readonly RawEdit[] = text.startsWith(BYTE_ORDER_MARK) ? [{ start: 0, end: BYTE_ORDER_MARK.length, text: '' }] : [];
  return [...bom, ...collect(program.body)].map((edit, order) => ({ ...edit, order }));
}

function needsSpace(left: string | undefined, right: string | undefined): boolean {
  return left !== undefined && right !== undefined && MERGING_PAIRS.has(left + right);
}

export function applyEdits(text: string, edits: readonly Edit[]): string {
  const sorted = [...edits].sort((a, b) => a.start - b.start || a.order - b.order);
  let output = '';
  let lastChar: string | undefined;
  let cursor = 0;
  const push = (piece: string): void => {
    if (piece === '') return;
    output += piece;
    lastChar = piece.at(-1);
  };
  for (const edit of sorted) {
    if (edit.start < cursor) throw new Error('edições sobrepostas');
    push(text.slice(cursor, edit.start));
    if (needsSpace(lastChar, edit.text[0])) push(' ');
    push(edit.text);
    cursor = edit.end;
    if (needsSpace(lastChar, text[cursor])) push(' ');
  }
  push(text.slice(cursor));
  return output;
}
