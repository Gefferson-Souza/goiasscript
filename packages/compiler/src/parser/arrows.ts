import type { ArrowFunctionExpression, BlockStatement, Expression, Identifier } from '../ast/ast.types.ts';
import { groupedBody, parseList } from './groups.ts';
import { identifierOf } from './members.ts';
import { ListBuilder } from './list-builder.ts';
import { CODES } from './parser.constants.ts';
import type { Parser } from './parser.types.ts';
import { PRECEDENCE } from './precedence.constants.ts';
import { errorNode } from './recovery.ts';
import { isPunctuator } from './token-tests.ts';

const ARROW = '=>';

export function arrowFollows(parser: Parser): boolean {
  const state = parser.state;
  const raw = state.rawPeek(0);
  return isPunctuator(raw, ARROW) || (raw.kind === 'newline' && isPunctuator(state.rawPeek(1), ARROW));
}

export function arrowFollowsVisible(parser: Parser): boolean {
  const state = parser.state;
  const next = state.rawAfter(0);
  return isPunctuator(next, ARROW) || (next.kind === 'newline' && isPunctuator(state.rawAfter(0, 2), ARROW));
}

function parseArrowBody(parser: Parser, arrowStart: number): BlockStatement | Expression {
  const state = parser.state;
  state.skipNewlines();
  if (isPunctuator(state.current(), '{')) return parser.parseBlock();
  const fallback = errorNode(CODES.tooDeep, arrowStart, arrowStart);
  return parser.nested(arrowStart, () => parser.parseExpression(PRECEDENCE.assignment), fallback);
}

export function finishArrow(parser: Parser, start: number, params: readonly Identifier[]): Expression {
  const state = parser.state;
  if (state.rawPeek(0).kind === 'newline') {
    const arrow = state.rawPeek(1);
    state.report(CODES.breakBeforeArrow, arrow.start, arrow.end);
    state.skipNewlines();
  }
  const arrowToken = state.advance();
  const body = parseArrowBody(parser, arrowToken.start);
  const node: ArrowFunctionExpression = { type: 'ArrowFunctionExpression', params, body, async: false, start, end: state.lastEnd };
  return parser.build(node);
}

function toParameters(parser: Parser, elements: readonly Expression[]): readonly Identifier[] {
  const params = new ListBuilder<Identifier>();
  for (const element of elements) {
    if (element.type === 'Identifier') params.add(element);
    else parser.state.report(CODES.unexpected, element.start, element.end, { found: parser.state.textOf(element.start, element.end) });
  }
  return params.build();
}

export function parseIdentifierArrow(parser: Parser): Expression {
  const token = parser.state.advance();
  return finishArrow(parser, token.start, [identifierOf(token)]);
}

export function parseParenthesized(parser: Parser): Expression {
  const group = groupedBody(parser, ')', () => parseList(parser, ')', () => parser.parseExpression(PRECEDENCE.assignment)), []);
  if (arrowFollows(parser)) return finishArrow(parser, group.start, toParameters(parser, group.value));
  const [only, ...rest] = group.value;
  if (only !== undefined && rest.length === 0) return only;
  parser.state.report(CODES.unexpected, group.start, group.end, { found: parser.state.textOf(group.start, group.end) });
  return errorNode(CODES.unexpected, group.start, group.end);
}
