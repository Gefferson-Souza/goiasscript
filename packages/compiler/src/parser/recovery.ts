import type { ErrorNode } from '../ast/ast.types.ts';
import type { Token } from '../lexer/token.types.ts';
import { CODES, NEWLINE_LABEL } from './parser.constants.ts';
import type { Parser } from './parser.types.ts';
import { isPunctuator, keywordJs } from './token-tests.ts';

const STATEMENT_START: ReadonlySet<string> = new Set([
  'const', 'let', 'function', 'async', 'async function', 'class', 'if', 'for', 'while', 'break', 'continue', 'return', 'throw', 'try',
]);
const CLOSERS: ReadonlySet<string> = new Set([')', ']']);

export const isStatementStart = (token: Token): boolean => STATEMENT_START.has(keywordJs(token) ?? '');

export const errorNode = (code: string, start: number, end: number): ErrorNode => ({ type: 'ErrorNode', code, start, end });

export const foundOf = (token: Token): string => (token.kind === 'newline' ? NEWLINE_LABEL : token.text);

export function reportUnexpected(parser: Parser): Token {
  const token = parser.state.current();
  if (token.kind === 'end-of-file') parser.state.report(CODES.unexpectedEnd, token.start, token.end);
  else parser.state.report(CODES.unexpected, token.start, token.end, { found: foundOf(token) });
  return token;
}

export function synchronize(parser: Parser): void {
  const state = parser.state;
  for (;;) {
    if (state.aborted) return;
    const token = state.rawPeek(0);
    const grouping = state.top === 'grouping';
    const stop =
      token.kind === 'end-of-file' ||
      isStatementStart(token) ||
      isPunctuator(token, '}') ||
      (!grouping && token.kind === 'newline') ||
      (grouping && token.kind === 'punctuator' && CLOSERS.has(token.value));
    if (stop) return;
    state.advance();
  }
}

export function ensureProgress(parser: Parser, before: number): void {
  const state = parser.state;
  if (state.cursor === before && state.current().kind !== 'end-of-file') state.advance();
}
