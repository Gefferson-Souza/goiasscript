import type { Expression } from '../ast/ast.types.ts';
import type { Token } from '../lexer/token.types.ts';
import { parsePostfix } from './members.ts';
import { parseOperand } from './operands.ts';
import { binaryOperatorAt, buildBinary } from './operators.ts';
import { CODES } from './parser.constants.ts';
import type { Parser } from './parser.types.ts';
import { PRECEDENCE } from './precedence.constants.ts';
import { errorNode } from './recovery.ts';
import { isPunctuator, keywordJs } from './token-tests.ts';

type PrefixKind = 'unary' | 'await';

function prefixKindOf(token: Token): PrefixKind | undefined {
  const js = keywordJs(token);
  if (js === 'await') return 'await';
  if (js === '!' || js === '-' || isPunctuator(token, '-')) return 'unary';
  return undefined;
}

function parseUnary(parser: Parser): Expression {
  const state = parser.state;
  const token = state.current();
  const kind = prefixKindOf(token);
  if (kind === undefined) return parsePostfix(parser, parseOperand(parser));
  state.advance();
  state.skipNewlines();
  const fallback = errorNode(CODES.tooDeep, token.start, token.start);
  const argument = parser.nested(token.start, () => parseExpression(parser, PRECEDENCE.unary), fallback);
  const range = { start: token.start, end: state.lastEnd };
  if (kind === 'await') return parser.build({ type: 'AwaitExpression', argument, keywordToken: token, ...range });
  return parser.build({ type: 'UnaryExpression', operator: token.keyword?.js ?? token.value, argument, operatorToken: token, ...range });
}

export function parseExpression(parser: Parser, minimum = 0): Expression {
  const state = parser.state;
  let left = parseUnary(parser);
  for (;;) {
    const operator = binaryOperatorAt(state.current());
    if (state.aborted || operator === undefined || operator.precedence < Math.max(minimum, PRECEDENCE.assignment)) return left;
    const token = state.advance();
    state.skipNewlines();
    const rightMinimum = operator.assignment ? operator.precedence : operator.precedence + 1;
    const fallback = errorNode(CODES.tooDeep, token.end, token.end);
    const right = parser.nested(left.start, () => parseExpression(parser, rightMinimum), fallback);
    left = parser.build(buildBinary(operator, token, left, right));
  }
}
