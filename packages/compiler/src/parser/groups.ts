import type { Token } from '../lexer/token.types.ts';
import type { Grouped } from './groups.types.ts';
import { acceptPunctuator, expectPunctuator } from './expect.ts';
import { ListBuilder } from './list-builder.ts';
import type { Parser } from './parser.types.ts';
import { reportUnexpected, synchronize } from './recovery.ts';
import { isPunctuator } from './token-tests.ts';

export function parseList<T>(parser: Parser, close: string, parseItem: () => T): readonly T[] {
  const state = parser.state;
  const items = new ListBuilder<T>();
  while (!state.aborted && !isPunctuator(state.current(), close) && state.current().kind !== 'end-of-file') {
    items.add(parseItem());
    if (acceptPunctuator(parser, ',') === undefined) break;
  }
  return items.build();
}

export function groupedBody<T>(parser: Parser, close: string, parseBody: (open: Token) => T, fallback: T): Grouped<T> {
  const state = parser.state;
  const open = state.advance();
  state.push('grouping');
  const value = parser.nested(open.start, () => parseBody(open), fallback);
  // Texto sem fechar leva o resto da linha, inclusive o fecho; o erro já saiu no lexer.
  const cutByInvalidText = state.lastToken?.kind === 'invalid' && state.rawPeek(0).kind === 'newline';
  const closer = cutByInvalidText ? acceptPunctuator(parser, close) : expectPunctuator(parser, close);
  state.pop();
  if (closer === undefined) synchronize(parser);
  return { value, start: open.start, end: closer?.end ?? state.lastEnd };
}

export function parseParenList<T>(parser: Parser, parseItem: () => T): readonly T[] {
  if (!isPunctuator(parser.state.current(), '(')) {
    reportUnexpected(parser);
    return [];
  }
  return groupedBody(parser, ')', () => parseList(parser, ')', parseItem), []).value;
}
