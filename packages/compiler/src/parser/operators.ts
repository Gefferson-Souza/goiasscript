import type { Expression } from '../ast/ast.types.ts';
import type { Token } from '../lexer/token.types.ts';
import { FOREIGN_BINARY_OPERATORS } from './foreign-operators.constants.ts';
import type { OperatorInfo } from './operators.types.ts';
import { ALLOWED_SYMBOL_OPERATORS, ASSIGNMENT_OPERATOR, BINARY_OPERATORS, PRECEDENCE } from './precedence.constants.ts';

function operatorSymbol(token: Token): string | undefined {
  if (token.kind === 'keyword') return token.keyword?.js;
  return token.kind === 'punctuator' && ALLOWED_SYMBOL_OPERATORS.has(token.value) ? token.value : undefined;
}

function foreignOperatorAt(token: Token): OperatorInfo | undefined {
  const foreign = token.kind === 'punctuator' ? FOREIGN_BINARY_OPERATORS.get(token.value) : undefined;
  return foreign === undefined ? undefined : { ...foreign, foreign: true };
}

export function binaryOperatorAt(token: Token): OperatorInfo | undefined {
  const symbol = operatorSymbol(token);
  if (symbol === undefined) return foreignOperatorAt(token);
  if (token.kind === 'keyword' && symbol === ASSIGNMENT_OPERATOR) {
    return { precedence: PRECEDENCE.assignment, js: symbol, logical: false, assignment: true, foreign: false };
  }
  const entry = BINARY_OPERATORS.get(symbol);
  return entry === undefined ? undefined : { precedence: entry.precedence, js: symbol, logical: entry.logical, assignment: false, foreign: false };
}

export function buildBinary(operator: OperatorInfo, token: Token, left: Expression, right: Expression): Expression {
  const common = { operator: operator.js, left, right, operatorToken: token, start: left.start, end: right.end };
  if (operator.assignment) return { type: 'AssignmentExpression', ...common };
  return { type: operator.logical ? 'LogicalExpression' : 'BinaryExpression', ...common };
}
