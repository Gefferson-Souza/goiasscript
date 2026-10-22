import type { Expression, Identifier, Literal, Property } from '../ast/ast.types.ts';
import type { Token } from '../lexer/token.types.ts';
import { arrowFollowsVisible, parseIdentifierArrow, parseParenthesized } from './arrows.ts';
import { acceptPunctuator } from './expect.ts';
import { groupedBody, parseList } from './groups.ts';
import { identifierOf, parseArguments, parseMemberChain } from './members.ts';
import { CODES } from './parser.constants.ts';
import type { Parser } from './parser.types.ts';
import { PRECEDENCE } from './precedence.constants.ts';
import { errorNode, foundOf } from './recovery.ts';
import { isPunctuator, isWord, keywordJs } from './token-tests.ts';

const LITERAL_KEYWORDS: ReadonlyMap<string, Literal['value']> = new Map<string, Literal['value']>([
  ['true', true],
  ['false', false],
  ['null', null],
  ['undefined', undefined],
]);

function literalOf(token: Token, value: Literal['value']): Literal {
  return { type: 'Literal', raw: token.text, value, start: token.start, end: token.end };
}

function lexerCodeAt(parser: Parser, token: Token): string {
  return parser.state.lexer.diagnostics.find((item) => item.start === token.start)?.code ?? CODES.unexpected;
}

function parseInvalid(parser: Parser): Expression {
  const token = parser.state.advance();
  return errorNode(lexerCodeAt(parser, token), token.start, token.end);
}

function parseName(parser: Parser): Expression {
  return arrowFollowsVisible(parser) ? parseIdentifierArrow(parser) : identifierOf(parser.state.advance());
}

function parseKeyOf(parser: Parser): Identifier | Literal {
  const token = parser.state.current();
  if (isWord(token)) return identifierOf(parser.state.advance());
  if (token.kind === 'string' || token.kind === 'number') return parseLiteralToken(parser);
  parser.unexpected();
  return { type: 'Identifier', name: '', start: token.start, end: token.start };
}

function parseLiteralToken(parser: Parser): Literal {
  const token = parser.state.advance();
  return literalOf(token, token.kind === 'number' ? Number(token.text) : token.value);
}

function parseProperty(parser: Parser): Property {
  const key = parseKeyOf(parser);
  if (acceptPunctuator(parser, ':') === undefined) parser.unexpected();
  const value = parser.parseExpression(PRECEDENCE.assignment);
  return { type: 'Property', key, value, start: key.start, end: value.end };
}

function parseArray(parser: Parser): Expression {
  const group = groupedBody(parser, ']', () => parseList(parser, ']', () => parser.parseExpression(PRECEDENCE.assignment)), []);
  return parser.build({ type: 'ArrayExpression', elements: group.value, start: group.start, end: group.end });
}

function parseObject(parser: Parser): Expression {
  const group = groupedBody(parser, '}', () => parseList(parser, '}', () => parseProperty(parser)), []);
  return parser.build({ type: 'ObjectExpression', properties: group.value, start: group.start, end: group.end });
}

function parseNew(parser: Parser): Expression {
  const keywordToken = parser.state.advance();
  const callee = parseMemberChain(parser, parseOperand(parser));
  const call = isPunctuator(parser.state.current(), '(') ? parseArguments(parser) : { args: [], end: callee.end };
  return parser.build({ type: 'NewExpression', callee, arguments: call.args, keywordToken, start: keywordToken.start, end: call.end });
}

function reportBreakAfterAsync(parser: Parser): void {
  const raw = parser.state.rawPeek(0);
  if (raw.kind === 'newline') parser.state.report(CODES.unexpected, raw.start, raw.end, { found: foundOf(raw) });
}

export function parseAsyncOperand(parser: Parser): Expression {
  const state = parser.state;
  const keywordToken = state.advance();
  reportBreakAfterAsync(parser);
  state.skipNewlines();
  const operand = parseOperand(parser);
  if (operand.type !== 'ArrowFunctionExpression') {
    state.report(CODES.unexpected, operand.start, operand.end, { found: state.textOf(operand.start, operand.end) });
    return operand;
  }
  return parser.build({ ...operand, async: true, keywordToken, start: keywordToken.start });
}

function parseKeywordOperand(parser: Parser, token: Token): Expression {
  const js = keywordJs(token) ?? '';
  if (LITERAL_KEYWORDS.has(js)) return literalWithKeyword(parser, js);
  if (js === 'this') return { type: 'ThisExpression', keywordToken: parser.state.advance(), start: token.start, end: token.end };
  if (js === 'super') return { type: 'Super', keywordToken: parser.state.advance(), start: token.start, end: token.end };
  if (js === 'new') return parseNew(parser);
  if (js === 'async') return parseAsyncOperand(parser);
  return token.keyword?.keywordClass === 'contextual' ? parseName(parser) : parser.unexpected();
}

function literalWithKeyword(parser: Parser, js: string): Literal {
  const token = parser.state.advance();
  return { ...literalOf(token, LITERAL_KEYWORDS.get(js)), keywordToken: token };
}

function parsePunctuatorOperand(parser: Parser, token: Token): Expression {
  if (isPunctuator(token, '(')) return parseParenthesized(parser);
  if (isPunctuator(token, '[')) return parseArray(parser);
  return isPunctuator(token, '{') ? parseObject(parser) : parser.unexpected();
}

export function parseOperand(parser: Parser): Expression {
  const token = parser.state.current();
  switch (token.kind) {
    case 'number':
    case 'string':
      return parseLiteralToken(parser);
    case 'identifier':
      return parseName(parser);
    case 'keyword':
      return parseKeywordOperand(parser, token);
    case 'punctuator':
      return parsePunctuatorOperand(parser, token);
    case 'invalid':
      return parseInvalid(parser);
    default:
      return parser.unexpected();
  }
}
