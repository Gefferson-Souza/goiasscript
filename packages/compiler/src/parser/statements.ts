import { lookupRetiredWord } from '@goiasscript/language';
import type { BlockStatement, Expression, ExpressionStatement, JumpStatement, ReturnStatement, Statement, ThrowStatement } from '../ast/ast.types.ts';
import { skipBalanced } from './balanced.ts';
import { parseClass } from './classes.ts';
import { parseFor, parseIf, parseTry, parseWhile } from './control.ts';
import { parseFunction, parseVariableDeclaration } from './declarations.ts';
import { expectPunctuator } from './expect.ts';
import { groupedBody, parseParenList } from './groups.ts';
import type { Token } from '../lexer/token.types.ts';
import { skipBlockBreak } from './layout.ts';
import { parseSubsetStatement } from './subset-statements.ts';
import { adoptJsWord, reportJsOperator } from './subset-checks.ts';
import { COMMA, GONE_PHRASE } from './subset.constants.ts';
import { binaryOperatorAt } from './operators.ts';
import { ListBuilder } from './list-builder.ts';
import { CODES } from './parser.constants.ts';
import type { ParserState } from './parser-state.ts';
import type { Parser } from './parser.types.ts';
import { PRECEDENCE } from './precedence.constants.ts';
import { ensureProgress, errorNode, foundOf, reportUnexpected, synchronize } from './recovery.ts';
import { isKeyword, isPunctuator, isStatementEnd, keywordJs } from './token-tests.ts';

type StatementParser = (parser: Parser) => Statement;

const UNARY_OR_BINARY_MINUS = '-';
const isBoundary = (token: Token): boolean => token.kind === 'end-of-file' || token.kind === 'newline' || isPunctuator(token, '}');
const RETURN_TERMINATORS: ReadonlySet<string> = new Set([';', '}']);

function consumeDecimalComma(parser: Parser): boolean {
  const state = parser.state;
  const comma = state.current();
  const previous = state.lastToken;
  const following = state.visibleAt(1);
  const glued = previous?.kind === 'number' && previous.end === comma.start && following.kind === 'number' && following.start === comma.end;
  if (!glued) return false;
  state.report(CODES.decimalComma, previous.start, following.end, { suggestion: `${previous.text}.${following.text}` });
  state.advance();
  state.advance();
  return true;
}

function endSimpleStatement(parser: Parser): void {
  const state = parser.state;
  let decimal = isPunctuator(state.current(), COMMA);
  while (decimal) decimal = isPunctuator(state.current(), COMMA) && consumeDecimalComma(parser);
  const token = state.current();
  if (isPunctuator(token, ';')) {
    state.advance();
    return;
  }
  if (isStatementEnd(token)) return;
  if (isPunctuator(token, COMMA)) reportJsOperator(parser, token);
  else reportUnexpected(parser);
  synchronize(parser);
}

function simple(parse: (parser: Parser) => Statement): StatementParser {
  return (parser) => {
    const statement = parse(parser);
    endSimpleStatement(parser);
    return statement;
  };
}

function parseJump(parser: Parser): JumpStatement {
  const keywordToken = parser.state.advance();
  const type = keywordToken.keyword?.js === 'break' ? 'BreakStatement' : 'ContinueStatement';
  return { type, keywordToken, start: keywordToken.start, end: keywordToken.end };
}

function parseReturn(parser: Parser): ReturnStatement {
  const state = parser.state;
  const keywordToken = state.advance();
  const next = state.current();
  const bare = next.kind === 'newline' || next.kind === 'end-of-file' || (next.kind === 'punctuator' && RETURN_TERMINATORS.has(next.value));
  const argument = bare ? null : parser.parseExpression(PRECEDENCE.assignment);
  return { type: 'ReturnStatement', argument, keywordToken, start: keywordToken.start, end: state.lastEnd };
}

function checkThrowShape(parser: Parser, statement: ThrowStatement): void {
  const state = parser.state;
  if (statement.arguments.length !== 1) state.report(CODES.misplacedThrow, statement.start, statement.end);
  const next = state.current();
  if (isStatementEnd(next)) return;
  state.report(CODES.misplacedThrow, next.start, next.end);
  synchronize(parser);
}

function parseThrow(parser: Parser): ThrowStatement {
  const state = parser.state;
  const keywordToken = state.advance();
  const parenthesized = isPunctuator(state.current(), '(');
  const args = parseParenList(parser, () => parser.parseExpression(PRECEDENCE.assignment));
  const statement: ThrowStatement = { type: 'ThrowStatement', arguments: args, keywordToken, start: keywordToken.start, end: state.lastEnd };
  if (parenthesized) checkThrowShape(parser, statement);
  return statement;
}

function parseExpressionStatement(parser: Parser): ExpressionStatement {
  const expression = parser.parseExpression();
  return { type: 'ExpressionStatement', expression, start: expression.start, end: parser.state.lastEnd };
}

const STATEMENT_PARSERS: ReadonlyMap<string, StatementParser> = new Map<string, StatementParser>([
  ['const', simple(parseVariableDeclaration)],
  ['let', simple(parseVariableDeclaration)],
  ['function', (parser) => parseFunction(parser)],
  ['async function', (parser) => parseFunction(parser)],
  ['async', parseAsyncStatement],
  ['class', parseClass],
  ['if', parseIf],
  ['while', parseWhile],
  ['for', parseFor],
  ['try', parseTry],
  ['else if', parseStrayContinuation],
  ['else', parseStrayContinuation],
  ['catch', parseStrayContinuation],
  ['finally', parseStrayContinuation],
  ['break', simple(parseJump)],
  ['continue', simple(parseJump)],
  ['return', simple(parseReturn)],
  ['throw', simple(parseThrow)],
]);

function skipRetiredConstruct(parser: Parser): void {
  const state = parser.state;
  while (!isStatementEnd(state.current()) && !isPunctuator(state.current(), '{')) state.advance();
  if (isPunctuator(state.current(), '{')) skipBalanced(parser);
}

// Palavra de versão anterior sozinha no início da instrução: GS0306 no lugar do GS0202 que viria.
function reportRetiredWord(parser: Parser, expression: Expression): void {
  const retired = expression.type === 'Identifier' ? lookupRetiredWord(expression.name) : undefined;
  if (retired === undefined || isStatementEnd(parser.state.current())) return;
  const detail = retired.replacement === undefined ? { gone: GONE_PHRASE } : { replacement: retired.replacement };
  parser.state.report(CODES.retiredWord, expression.start, expression.end, { word: retired.word, ...detail });
  skipRetiredConstruct(parser);
}

function parseSimpleExpression(parser: Parser): Statement {
  const statement = parseExpressionStatement(parser);
  reportRetiredWord(parser, statement.expression);
  endSimpleStatement(parser);
  return statement;
}

function parseAsyncStatement(parser: Parser): Statement {
  const state = parser.state;
  const raw = state.rawPeek(1);
  if (raw.kind === 'newline') {
    const token = state.advance();
    state.report(CODES.unexpected, raw.start, raw.end, { found: foundOf(raw) });
    return errorNode(CODES.unexpected, token.start, token.end);
  }
  if (!isKeyword(state.visibleAt(1), 'function')) return parseSimpleExpression(parser);
  return parseFunction(parser, state.advance());
}

function parseStrayContinuation(parser: Parser): Statement {
  const state = parser.state;
  const token = state.advance();
  state.report(CODES.orphanContinuation, token.start, token.end, { found: token.text });
  const fallback = errorNode(CODES.orphanContinuation, token.end, token.end);
  if (isPunctuator(state.current(), '(')) groupedBody(parser, ')', () => parser.parseExpression(), fallback);
  skipBlockBreak(state);
  if (isPunctuator(state.current(), '{')) parser.parseBlock();
  return errorNode(CODES.orphanContinuation, token.start, state.lastEnd);
}

function parseLeadingOperator(parser: Parser): Statement {
  const state = parser.state;
  const token = state.advance();
  state.report(CODES.lineStartsWithOperator, token.start, token.end, { found: token.text });
  synchronize(parser);
  return errorNode(CODES.lineStartsWithOperator, token.start, state.lastEnd);
}

function startsWithBinaryOperator(token: Token): boolean {
  const operator = binaryOperatorAt(token);
  return operator !== undefined && operator.js !== UNARY_OR_BINARY_MINUS;
}

export function parseStatement(parser: Parser): Statement {
  const first = parser.state.current();
  if (isPunctuator(first, '{')) return parser.parseBlock();
  if (startsWithBinaryOperator(first)) return parseLeadingOperator(parser);
  const subset = parseSubsetStatement(parser);
  if (subset !== undefined) return subset;
  const token = adoptJsWord(parser);
  const handler = STATEMENT_PARSERS.get(keywordJs(token) ?? '');
  return (handler ?? parseSimpleExpression)(parser);
}

export function parseStatements(parser: Parser, terminator: 'program' | 'block'): readonly Statement[] {
  const state = parser.state;
  const items = new ListBuilder<Statement>();
  for (;;) {
    skipSeparators(state);
    const token = state.current();
    if (state.aborted || token.kind === 'end-of-file') break;
    if (terminator === 'block' && isPunctuator(token, '}')) break;
    const before = state.cursor;
    items.add(parser.parseStatement());
    ensureProgress(parser, before);
  }
  return items.build();
}

function skipSeparators(state: ParserState): void {
  while (state.current().kind === 'newline' || isPunctuator(state.current(), ';')) state.advance();
}

function parseBlockBody(parser: Parser): BlockStatement {
  const state = parser.state;
  const open = expectPunctuator(parser, '{');
  if (open === undefined) return { type: 'BlockStatement', body: [], synthetic: true, start: state.lastEnd, end: state.lastEnd };
  state.push('statement');
  const body = parseStatements(parser, 'block');
  expectPunctuator(parser, '}');
  state.pop();
  return { type: 'BlockStatement', body, start: open.start, end: state.lastEnd };
}

function startsBlocklessBody(state: ParserState): boolean {
  if (state.rawPeek(0).kind === 'newline' && state.top === 'statement' && !isBoundary(state.rawPeek(1))) state.skipNewlines();
  return !isBoundary(state.current()) && !isPunctuator(state.current(), '{');
}

function parseBlocklessBody(parser: Parser): BlockStatement {
  const state = parser.state;
  const first = state.current();
  state.report(CODES.bodyWithoutBraces, first.start, first.end);
  const statement = parser.parseStatement();
  return { type: 'BlockStatement', body: [statement], synthetic: true, start: first.start, end: state.lastEnd };
}

export function parseBlock(parser: Parser): BlockStatement {
  const state = parser.state;
  skipBlockBreak(state);
  const blockless = startsBlocklessBody(state);
  const start = state.current().start;
  const fallback: BlockStatement = { type: 'BlockStatement', body: [], synthetic: true, start, end: start };
  return parser.nested(start, () => (blockless ? parseBlocklessBody(parser) : parseBlockBody(parser)), fallback);
}
