import type { Expression, Identifier, Literal, Property } from '../ast/ast.types.ts';
import { skipBalanced } from './balanced.ts';
import { parseParameters } from './declarations.ts';
import { acceptPunctuator } from './expect.ts';
import { parseLiteralToken } from './literals.ts';
import { identifierOf } from './members.ts';
import { CODES } from './parser.constants.ts';
import type { Parser } from './parser.types.ts';
import { PRECEDENCE } from './precedence.constants.ts';
import { errorNode } from './recovery.ts';
import { SPREAD_OPERATOR } from './subset.constants.ts';
import { isPunctuator, isWord } from './token-tests.ts';

function placeholderKey(position: number): Identifier {
  return { type: 'Identifier', name: '', start: position, end: position };
}

function parseKeyOf(parser: Parser): Identifier | Literal {
  const token = parser.state.current();
  if (isWord(token)) return identifierOf(parser.state.advance());
  if (token.kind === 'string' || token.kind === 'number') return parseLiteralToken(parser);
  parser.unexpected();
  return placeholderKey(token.start);
}

function parseValue(parser: Parser): Expression {
  return parser.parseExpression(PRECEDENCE.assignment);
}

function parseComputedKey(parser: Parser): Property {
  const state = parser.state;
  const open = state.current();
  skipBalanced(parser);
  state.report(CODES.computedKey, open.start, state.lastEnd);
  const value = acceptPunctuator(parser, ':') === undefined ? errorNode(CODES.computedKey, open.start, state.lastEnd) : parseValue(parser);
  return { type: 'Property', key: placeholderKey(open.start), value, start: open.start, end: state.lastEnd };
}

function parseSpreadProperty(parser: Parser): Property {
  const spread = parser.state.advance();
  parser.state.report(CODES.spread, spread.start, spread.end);
  const value = parseValue(parser);
  return { type: 'Property', key: placeholderKey(spread.start), value, start: spread.start, end: value.end };
}

function parseShorthandMethod(parser: Parser, key: Identifier | Literal): Property {
  parseParameters(parser);
  parser.parseBlock();
  const end = parser.state.lastEnd;
  parser.state.report(CODES.shorthandMethod, key.start, end);
  return { type: 'Property', key, value: errorNode(CODES.shorthandMethod, key.start, end), start: key.start, end };
}

export function parseProperty(parser: Parser): Property {
  const state = parser.state;
  const first = state.current();
  if (isPunctuator(first, '[')) return parseComputedKey(parser);
  if (isPunctuator(first, SPREAD_OPERATOR)) return parseSpreadProperty(parser);
  const key = parseKeyOf(parser);
  const next = state.current();
  if (isPunctuator(next, '(')) return parseShorthandMethod(parser, key);
  if (isPunctuator(next, ',') || isPunctuator(next, '}')) {
    state.report(CODES.shorthandProperty, key.start, key.end);
    return { type: 'Property', key, value: key, start: key.start, end: key.end };
  }
  if (acceptPunctuator(parser, ':') === undefined) parser.unexpected();
  const value = parseValue(parser);
  return { type: 'Property', key, value, start: key.start, end: value.end };
}
