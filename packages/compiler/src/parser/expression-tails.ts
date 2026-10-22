import type { Expression } from '../ast/ast.types.ts';
import type { Token } from '../lexer/token.types.ts';
import { CODES } from './parser.constants.ts';
import type { Parser } from './parser.types.ts';
import { PRECEDENCE } from './precedence.constants.ts';
import { errorNode, reportUnexpected } from './recovery.ts';
import { reportJsOperator } from './subset-checks.ts';
import { TERNARY_OPERATOR, UPDATE_OPERATORS } from './subset.constants.ts';
import { isPunctuator } from './token-tests.ts';

const COLON = ':';

function parseTernaryTail(parser: Parser, left: Expression): Expression {
  const state = parser.state;
  const question = state.advance();
  reportJsOperator(parser, question);
  state.skipNewlines();
  const fallback = errorNode(CODES.tooDeep, question.end, question.end);
  parser.nested(question.start, () => parser.parseExpression(PRECEDENCE.assignment), fallback);
  if (isPunctuator(state.current(), COLON)) {
    state.advance();
    state.skipNewlines();
    parser.nested(question.start, () => parser.parseExpression(PRECEDENCE.assignment), fallback);
  } else {
    reportUnexpected(parser);
  }
  return errorNode(CODES.foreignOperator, left.start, state.lastEnd);
}

const isUpdate = (token: Token): boolean => token.kind === 'punctuator' && UPDATE_OPERATORS.has(token.value);

// Formas do JavaScript que seguem um operando: `x++`, `x--` e `a ? b : c`. Devolve undefined quando não há nenhuma.
export function parseForeignTail(parser: Parser, left: Expression, floor: number): Expression | undefined {
  const token = parser.state.current();
  if (isUpdate(token)) {
    reportJsOperator(parser, parser.state.advance());
    return left;
  }
  if (floor <= PRECEDENCE.assignment && isPunctuator(token, TERNARY_OPERATOR)) return parseTernaryTail(parser, left);
  return undefined;
}
