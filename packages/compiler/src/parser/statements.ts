import type { BlockStatement, ExpressionStatement, JumpStatement, ReturnStatement, Statement, ThrowStatement } from '../ast/ast.types.ts';
import { parseClass } from './classes.ts';
import { parseFor, parseIf, parseTry, parseWhile } from './control.ts';
import { parseFunction, parseVariableDeclaration } from './declarations.ts';
import { expectPunctuator } from './expect.ts';
import { groupedBody, parseParenList } from './groups.ts';
import type { Token } from '../lexer/token.types.ts';
import { skipBlockBreak } from './layout.ts';
import { binaryOperatorAt } from './operators.ts';
import { ListBuilder } from './list-builder.ts';
import { CODES } from './parser.constants.ts';
import type { ParserState } from './parser-state.ts';
import type { Parser } from './parser.types.ts';
import { PRECEDENCE } from './precedence.constants.ts';
import { ensureProgress, errorNode, foundOf, reportUnexpected, synchronize } from './recovery.ts';
import { isKeyword, isPunctuator, keywordJs } from './token-tests.ts';

type StatementParser = (parser: Parser) => Statement;

const UNARY_OR_BINARY_MINUS = '-';
const RETURN_TERMINATORS: ReadonlySet<string> = new Set([';', '}']);

function endSimpleStatement(parser: Parser): void {
  const state = parser.state;
  const token = state.current();
  if (isPunctuator(token, ';')) {
    state.advance();
    return;
  }
  if (token.kind === 'newline' || token.kind === 'end-of-file' || isPunctuator(token, '}')) return;
  reportUnexpected(parser);
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

function parseThrow(parser: Parser): ThrowStatement {
  const state = parser.state;
  const keywordToken = state.advance();
  const args = parseParenList(parser, () => parser.parseExpression(PRECEDENCE.assignment));
  return { type: 'ThrowStatement', arguments: args, keywordToken, start: keywordToken.start, end: state.lastEnd };
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

const parseSimpleExpression = simple(parseExpressionStatement);

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
  const token = parser.state.current();
  if (isPunctuator(token, '{')) return parser.parseBlock();
  if (startsWithBinaryOperator(token)) return parseLeadingOperator(parser);
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

export function parseBlock(parser: Parser): BlockStatement {
  const state = parser.state;
  skipBlockBreak(state);
  const start = state.current().start;
  const fallback: BlockStatement = { type: 'BlockStatement', body: [], synthetic: true, start, end: start };
  return parser.nested(start, () => parseBlockBody(parser), fallback);
}
