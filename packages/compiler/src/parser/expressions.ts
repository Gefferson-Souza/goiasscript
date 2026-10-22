import type { Expression } from '../ast/ast.types.ts';
import type { Token } from '../lexer/token.types.ts';
import { parseForeignTail } from './expression-tails.ts';
import { parsePostfix } from './members.ts';
import { parseOperand } from './operands.ts';
import { binaryOperatorAt, buildBinary } from './operators.ts';
import { CODES } from './parser.constants.ts';
import type { Parser } from './parser.types.ts';
import { PRECEDENCE } from './precedence.constants.ts';
import { errorNode } from './recovery.ts';
import { adoptJsWord, reportForeignPrefix, reportJsOperator } from './subset-checks.ts';
import { FOREIGN_PREFIX_OPERATORS, PREFIX_WORDS, SPREAD_OPERATOR } from './subset.constants.ts';
import { isPunctuator, keywordJs } from './token-tests.ts';

type PrefixKind = 'unary' | 'await' | 'foreign';

const BANG = '!';
const INSTANCEOF_WORD = 'instanceof';

function prefixKindOf(token: Token): PrefixKind | undefined {
  const js = keywordJs(token);
  if (js === 'await') return 'await';
  if (js === BANG || js === '-' || isPunctuator(token, '-') || isPunctuator(token, BANG)) return 'unary';
  if (token.kind === 'identifier' && PREFIX_WORDS.has(token.value)) return 'foreign';
  const symbol = token.kind === 'punctuator' ? token.value : '';
  return FOREIGN_PREFIX_OPERATORS.has(symbol) || symbol === SPREAD_OPERATOR ? 'foreign' : undefined;
}

function parseUnary(parser: Parser): Expression {
  const state = parser.state;
  const token = adoptJsWord(parser);
  const kind = prefixKindOf(token);
  if (kind === undefined) return parsePostfix(parser, parseOperand(parser));
  if (kind === 'foreign' || isPunctuator(token, BANG)) reportForeignPrefix(parser, token);
  state.advance();
  state.skipNewlines();
  const fallback = errorNode(CODES.tooDeep, token.start, token.start);
  const argument = parser.nested(token.start, () => parseExpression(parser, PRECEDENCE.unary), fallback);
  if (kind === 'foreign') return argument;
  const range = { start: token.start, end: state.lastEnd };
  if (kind === 'await') return parser.build({ type: 'AwaitExpression', argument, keywordToken: token, ...range });
  return parser.build({ type: 'UnaryExpression', operator: token.keyword?.js ?? token.value, argument, operatorToken: token, ...range });
}

// Com o lado direito cortado pelo fim da entrada, o REPL ainda espera mais; o alvo só se julga depois.
function reportInvalidTarget(parser: Parser, left: Expression, right: Expression): void {
  const assignable = left.type === 'Identifier' || left.type === 'MemberExpression' || left.type === 'ErrorNode';
  const cutOff = right.type === 'ErrorNode' && right.code === CODES.unexpectedEnd;
  if (!assignable && !cutOff) parser.state.report(CODES.invalidTarget, left.start, left.end);
}

export function parseExpression(parser: Parser, minimum = 0): Expression {
  const state = parser.state;
  const floor = Math.max(minimum, PRECEDENCE.assignment);
  let left = parseUnary(parser);
  for (;;) {
    if (state.aborted) return left;
    const tail = parseForeignTail(parser, left, floor);
    if (tail !== undefined) {
      left = tail;
      continue;
    }
    if (state.current().value === INSTANCEOF_WORD) adoptJsWord(parser);
    const operator = binaryOperatorAt(state.current());
    if (operator === undefined || operator.precedence < floor) return left;
    const token = state.advance();
    if (operator.foreign) reportJsOperator(parser, token);
    state.skipNewlines();
    const rightMinimum = operator.assignment ? operator.precedence : operator.precedence + 1;
    const fallback = errorNode(CODES.tooDeep, token.end, token.end);
    const right = parser.nested(left.start, () => parseExpression(parser, rightMinimum), fallback);
    if (operator.assignment) reportInvalidTarget(parser, left, right);
    left = parser.build(buildBinary(operator, token, left, right));
  }
}
