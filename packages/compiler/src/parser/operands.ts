import type { Expression, Literal } from '../ast/ast.types.ts';
import type { Token } from '../lexer/token.types.ts';
import { arrowFollowsVisible, parseIdentifierArrow, parseParenthesized } from './arrows.ts';
import { parseParameters } from './declarations.ts';
import { groupedBody, parseList, parseParenList } from './groups.ts';
import { literalOf, parseLiteralToken } from './literals.ts';
import { identifierOf, parseArguments, parseMemberChain } from './members.ts';
import { CODES } from './parser.constants.ts';
import type { Parser } from './parser.types.ts';
import { PRECEDENCE } from './precedence.constants.ts';
import { parseProperty } from './properties.ts';
import { errorNode, foundOf, synchronize } from './recovery.ts';
import { adoptJsWord, reportJsWord } from './subset-checks.ts';
import { PRIVATE_MARK, SUBSET_BY_WORD } from './subset.constants.ts';
import { isPunctuator, isWord, keywordJs } from './token-tests.ts';

const LITERAL_KEYWORDS: ReadonlyMap<string, Literal['value']> = new Map<string, Literal['value']>([
  ['true', true],
  ['false', false],
  ['null', null],
  ['undefined', undefined],
]);

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

function parseFunctionValue(parser: Parser): Expression {
  const state = parser.state;
  const keywordToken = state.advance();
  if (isWord(state.current()) && isPunctuator(state.visibleAt(1), '(')) state.advance();
  parseParameters(parser);
  parser.parseBlock();
  state.report(CODES.anonymousFunction, keywordToken.start, keywordToken.end);
  return errorNode(CODES.anonymousFunction, keywordToken.start, state.lastEnd);
}

function parseThrowValue(parser: Parser): Expression {
  const state = parser.state;
  const keywordToken = state.advance();
  if (isPunctuator(state.current(), '(')) parseParenList(parser, () => parser.parseExpression(PRECEDENCE.assignment));
  state.report(CODES.misplacedThrow, keywordToken.start, state.lastEnd);
  return errorNode(CODES.misplacedThrow, keywordToken.start, state.lastEnd);
}

function parseKeywordOperand(parser: Parser, token: Token): Expression {
  const js = keywordJs(token) ?? '';
  if (LITERAL_KEYWORDS.has(js)) return literalWithKeyword(parser, js);
  if (js === 'this') return { type: 'ThisExpression', keywordToken: parser.state.advance(), start: token.start, end: token.end };
  if (js === 'super') return { type: 'Super', keywordToken: parser.state.advance(), start: token.start, end: token.end };
  if (js === 'new') return parseNew(parser);
  if (js === 'async') return parseAsyncOperand(parser);
  if (js === 'function' || js === 'async function') return parseFunctionValue(parser);
  if (js === 'throw') return parseThrowValue(parser);
  return token.keyword?.keywordClass === 'contextual' ? parseName(parser) : parser.unexpected();
}

function literalWithKeyword(parser: Parser, js: string): Literal {
  const token = parser.state.advance();
  return { ...literalOf(token, LITERAL_KEYWORDS.get(js)), keywordToken: token };
}

function parseRegex(parser: Parser): Expression {
  const regex = parser.state.advanceRegex();
  parser.state.report(CODES.regex, regex.start, regex.end);
  if (regex.end - regex.start === 1) synchronize(parser);
  return errorNode(CODES.regex, regex.start, parser.state.lastEnd);
}

function parsePrivateName(parser: Parser): Expression {
  const state = parser.state;
  const mark = state.advance();
  if (isWord(state.current())) state.advance();
  state.report(CODES.privateField, mark.start, state.lastEnd);
  return errorNode(CODES.privateField, mark.start, state.lastEnd);
}

function parsePunctuatorOperand(parser: Parser, token: Token): Expression {
  if (isPunctuator(token, '(')) return parseParenthesized(parser);
  if (isPunctuator(token, '[')) return parseArray(parser);
  if (isPunctuator(token, '{')) return parseObject(parser);
  if (isPunctuator(token, '/') || isPunctuator(token, '/=')) return parseRegex(parser);
  return isPunctuator(token, PRIVATE_MARK) ? parsePrivateName(parser) : parser.unexpected();
}

function parseForeignWord(parser: Parser, token: Token): Expression {
  reportJsWord(parser, token);
  parser.state.advance();
  return errorNode(CODES.unsupported, token.start, token.end);
}

function parseNumber(parser: Parser, token: Token): Expression {
  if (token.numberForm === undefined || token.numberForm === 'decimal') return parseLiteralToken(parser);
  parser.state.advance();
  parser.state.report(CODES.numberForm, token.start, token.end);
  return errorNode(CODES.numberForm, token.start, token.end);
}

function parseTemplate(parser: Parser): Expression {
  const token = parser.state.advance();
  parser.state.report(CODES.template, token.start, token.end);
  return errorNode(CODES.template, token.start, token.end);
}

function parseIdentifier(parser: Parser, token: Token): Expression {
  return SUBSET_BY_WORD.has(token.value) ? parseForeignWord(parser, token) : parseName(parser);
}

export function parseOperand(parser: Parser): Expression {
  const token = adoptJsWord(parser);
  switch (token.kind) {
    case 'number':
      return parseNumber(parser, token);
    case 'string':
      return parseLiteralToken(parser);
    case 'template':
      return parseTemplate(parser);
    case 'identifier':
      return parseIdentifier(parser, token);
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
