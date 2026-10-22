import type { Expression, Identifier } from '../ast/ast.types.ts';
import type { Token } from '../lexer/token.types.ts';
import { groupedBody, parseList } from './groups.ts';
import { continueAcrossNewline } from './layout.ts';
import { CODES } from './parser.constants.ts';
import type { Parser } from './parser.types.ts';
import { PRECEDENCE } from './precedence.constants.ts';
import { errorNode } from './recovery.ts';
import { reportJsOperator } from './subset-checks.ts';
import { OPTIONAL_CHAIN } from './subset.constants.ts';
import { isPunctuator, isWord } from './token-tests.ts';

export const identifierOf = (token: Token): Identifier => ({ type: 'Identifier', name: token.value, start: token.start, end: token.end });

export function parseArguments(parser: Parser): { readonly args: readonly Expression[]; readonly end: number } {
  const group = groupedBody(parser, ')', () => parseList(parser, ')', () => parser.parseExpression(PRECEDENCE.assignment)), []);
  return { args: group.value, end: group.end };
}

function reportNumberMember(parser: Parser, object: Expression, dot: Token, name: Token): void {
  const glued = object.type === 'Literal' && typeof object.value === 'number' && dot.start === object.end;
  if (glued) parser.state.report(CODES.unexpected, dot.start, name.end, { found: parser.state.textOf(dot.start, name.end) });
}

export function parseMember(parser: Parser, object: Expression): Expression {
  const state = parser.state;
  const dot = state.advance();
  state.skipNewlines();
  const token = state.current();
  if (isWord(token)) reportNumberMember(parser, object, dot, token);
  const property: Expression = isWord(token) ? identifierOf(state.advance()) : parser.unexpected();
  return parser.build({ type: 'MemberExpression', object, property, computed: false, start: object.start, end: state.lastEnd });
}

function parseCall(parser: Parser, callee: Expression): Expression {
  const { args, end } = parseArguments(parser);
  return parser.build({ type: 'CallExpression', callee, arguments: args, start: callee.start, end });
}

function parseIndex(parser: Parser, object: Expression): Expression {
  const here = parser.state.current().start;
  const fallback = errorNode(CODES.tooDeep, here, here);
  const group = groupedBody(parser, ']', () => parser.parseExpression(), fallback);
  return parser.build({ type: 'MemberExpression', object, property: group.value, computed: true, start: object.start, end: group.end });
}

function parseOptionalStep(parser: Parser, node: Expression): Expression {
  const state = parser.state;
  reportJsOperator(parser, state.current());
  const following = state.visibleAt(1);
  if (!isPunctuator(following, '(') && !isPunctuator(following, '[')) return parseMember(parser, node);
  state.advance();
  return isPunctuator(following, '(') ? parseCall(parser, node) : parseIndex(parser, node);
}

function stepOf(parser: Parser, node: Expression): Expression | undefined {
  const state = parser.state;
  continueAcrossNewline(state);
  const token = state.current();
  if (isPunctuator(token, '.')) return parseMember(parser, node);
  if (isPunctuator(token, '(')) return parseCall(parser, node);
  if (isPunctuator(token, OPTIONAL_CHAIN)) return parseOptionalStep(parser, node);
  return isPunctuator(token, '[') ? parseIndex(parser, node) : undefined;
}

export function parsePostfix(parser: Parser, operand: Expression): Expression {
  let node = operand;
  for (;;) {
    if (parser.state.aborted) return node;
    const next = stepOf(parser, node);
    if (next === undefined) return node;
    node = next;
  }
}

export function parseMemberChain(parser: Parser, operand: Expression): Expression {
  let node = operand;
  while (!parser.state.aborted && isPunctuator(parser.state.current(), '.')) node = parseMember(parser, node);
  return node;
}
