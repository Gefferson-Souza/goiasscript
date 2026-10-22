import type { Token } from '../lexer/token.types.ts';
import type { Parser } from './parser.types.ts';
import { reportUnexpected } from './recovery.ts';
import { isPunctuator } from './token-tests.ts';

export function acceptPunctuator(parser: Parser, value: string): Token | undefined {
  return isPunctuator(parser.state.current(), value) ? parser.state.advance() : undefined;
}

export function expectPunctuator(parser: Parser, value: string): Token | undefined {
  const accepted = acceptPunctuator(parser, value);
  if (accepted === undefined) reportUnexpected(parser);
  return accepted;
}
