import type { Literal } from '../ast/ast.types.ts';
import type { Token } from '../lexer/token.types.ts';
import type { Parser } from './parser.types.ts';

export function literalOf(token: Token, value: Literal['value']): Literal {
  return { type: 'Literal', raw: token.text, value, start: token.start, end: token.end };
}

export function parseLiteralToken(parser: Parser): Literal {
  const token = parser.state.advance();
  return literalOf(token, token.kind === 'number' ? Number(token.text) : token.value);
}
