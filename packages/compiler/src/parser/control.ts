import type {
  BlockStatement, CatchClause, Expression, ForStatement, ForEachStatement, Identifier, IfStatement, TryStatement, WhileStatement,
} from '../ast/ast.types.ts';
import type { ClassicForParts, ForParts } from './control.types.ts';
import { parseBindingName, parseVariableDeclaration } from './declarations.ts';
import { expectPunctuator } from './expect.ts';
import { groupedBody } from './groups.ts';
import { continuesWith } from './layout.ts';
import { CODES } from './parser.constants.ts';
import type { Parser } from './parser.types.ts';
import { errorNode, foundOf, reportUnexpected } from './recovery.ts';
import { isKeyword, isPunctuator, keywordJs } from './token-tests.ts';

const IF_CONTINUATIONS: ReadonlySet<string> = new Set(['else if', 'else']);
const TRY_CONTINUATIONS: ReadonlySet<string> = new Set(['catch', 'finally']);
const FINALLY_ONLY: ReadonlySet<string> = new Set(['finally']);
const DECLARATION_KEYWORDS: ReadonlySet<string> = new Set(['const', 'let']);
const EACH_TYPES: ReadonlyMap<string, 'ForOfStatement' | 'ForInStatement'> = new Map([
  ['of', 'ForOfStatement'],
  ['in', 'ForInStatement'],
]);

function parseCondition(parser: Parser): Expression {
  const here = parser.state.current();
  const fallback = errorNode(CODES.tooDeep, here.start, here.start);
  if (!isPunctuator(here, '(')) {
    reportUnexpected(parser);
    return fallback;
  }
  return groupedBody(parser, ')', () => parser.parseExpression(), fallback).value;
}

function parseAlternate(parser: Parser): IfStatement | BlockStatement | null {
  const state = parser.state;
  if (!continuesWith(parser, IF_CONTINUATIONS)) return null;
  const token = state.current();
  const fallback: BlockStatement = { type: 'BlockStatement', body: [], synthetic: true, start: token.start, end: token.start };
  if (!isKeyword(token, 'else if')) {
    state.advance();
    return parser.parseBlock();
  }
  return parser.nested<IfStatement | BlockStatement>(token.start, () => parseIf(parser), fallback);
}

export function parseIf(parser: Parser): IfStatement {
  const keywordToken = parser.state.advance();
  const test = parseCondition(parser);
  const consequent = parser.parseBlock();
  const alternate = parseAlternate(parser);
  return { type: 'IfStatement', test, consequent, alternate, keywordToken, start: keywordToken.start, end: parser.state.lastEnd };
}

export function parseWhile(parser: Parser): WhileStatement {
  const keywordToken = parser.state.advance();
  const test = parseCondition(parser);
  const body = parser.parseBlock();
  return { type: 'WhileStatement', test, body, keywordToken, start: keywordToken.start, end: parser.state.lastEnd };
}

function parseOptionalPart(parser: Parser, stop: string): Expression | null {
  return isPunctuator(parser.state.current(), stop) ? null : parser.parseExpression();
}

function parseForParts(parser: Parser): ForParts {
  const state = parser.state;
  const token = state.current();
  const isDeclaration = DECLARATION_KEYWORDS.has(keywordJs(token) ?? '');
  const init = isDeclaration ? parseVariableDeclaration(parser) : parseOptionalPart(parser, ';');
  const eachType = EACH_TYPES.get(keywordJs(state.current()) ?? '');
  if (init?.type === 'VariableDeclaration' && eachType !== undefined) {
    state.advance();
    return { kind: 'each', type: eachType, left: init, right: parser.parseExpression() };
  }
  expectPunctuator(parser, ';');
  const test = parseOptionalPart(parser, ';');
  expectPunctuator(parser, ';');
  return { kind: 'classic', init, test, update: parseOptionalPart(parser, ')') };
}

export function parseFor(parser: Parser): ForStatement | ForEachStatement {
  const state = parser.state;
  const keywordToken = state.advance();
  const empty: ClassicForParts = { kind: 'classic', init: null, test: null, update: null };
  let parts: ForParts = empty;
  if (isPunctuator(state.current(), '(')) parts = groupedBody(parser, ')', () => parseForParts(parser), empty).value;
  else reportUnexpected(parser);
  const body = parser.parseBlock();
  const range = { keywordToken, body, start: keywordToken.start, end: state.lastEnd };
  if (parts.kind === 'each') return { type: parts.type, left: parts.left, right: parts.right, ...range };
  return { type: 'ForStatement', init: parts.init, test: parts.test, update: parts.update, ...range };
}

function parseCatch(parser: Parser): CatchClause {
  const state = parser.state;
  const keywordToken = state.advance();
  const param: Identifier | null = isPunctuator(state.current(), '(')
    ? groupedBody(parser, ')', () => parseBindingName(parser), null).value
    : null;
  const body = parser.parseBlock();
  return { type: 'CatchClause', param, body, keywordToken, start: keywordToken.start, end: state.lastEnd };
}

function parseFinally(parser: Parser): BlockStatement {
  parser.state.advance();
  return parser.parseBlock();
}

function parseClauses(parser: Parser): { readonly handler: CatchClause | null; readonly finalizer: BlockStatement | null } {
  const state = parser.state;
  if (!continuesWith(parser, TRY_CONTINUATIONS)) return { handler: null, finalizer: null };
  if (!isKeyword(state.current(), 'catch')) return { handler: null, finalizer: parseFinally(parser) };
  const handler = parseCatch(parser);
  return { handler, finalizer: continuesWith(parser, FINALLY_ONLY) ? parseFinally(parser) : null };
}

export function parseTry(parser: Parser): TryStatement {
  const state = parser.state;
  const keywordToken = state.advance();
  const block = parser.parseBlock();
  const { handler, finalizer } = parseClauses(parser);
  if (handler === null && finalizer === null) {
    const token = state.current();
    state.report(CODES.unexpected, token.start, token.end, { found: foundOf(token) });
  }
  return { type: 'TryStatement', block, handler, finalizer, keywordToken, start: keywordToken.start, end: state.lastEnd };
}
