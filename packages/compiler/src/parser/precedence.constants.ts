const ASSIGNMENT = 1;
const LOGICAL_OR = 3;
const LOGICAL_AND = 4;
const EQUALITY = 8;
const RELATIONAL = 9;
const ADDITIVE = 11;
const MULTIPLICATIVE = 12;
const UNARY = 14;
const POSTFIX = 17;

export const PRECEDENCE = {
  assignment: ASSIGNMENT,
  logicalOr: LOGICAL_OR,
  logicalAnd: LOGICAL_AND,
  equality: EQUALITY,
  relational: RELATIONAL,
  additive: ADDITIVE,
  multiplicative: MULTIPLICATIVE,
  unary: UNARY,
  postfix: POSTFIX,
} as const;

export const BINARY_OPERATORS: ReadonlyMap<string, { readonly precedence: number; readonly logical: boolean }> = new Map([
  ['||', { precedence: PRECEDENCE.logicalOr, logical: true }],
  ['&&', { precedence: PRECEDENCE.logicalAnd, logical: true }],
  ['===', { precedence: PRECEDENCE.equality, logical: false }],
  ['!==', { precedence: PRECEDENCE.equality, logical: false }],
  ['<', { precedence: PRECEDENCE.relational, logical: false }],
  ['>', { precedence: PRECEDENCE.relational, logical: false }],
  ['<=', { precedence: PRECEDENCE.relational, logical: false }],
  ['>=', { precedence: PRECEDENCE.relational, logical: false }],
  ['instanceof', { precedence: PRECEDENCE.relational, logical: false }],
  ['+', { precedence: PRECEDENCE.additive, logical: false }],
  ['-', { precedence: PRECEDENCE.additive, logical: false }],
  ['*', { precedence: PRECEDENCE.multiplicative, logical: false }],
  ['/', { precedence: PRECEDENCE.multiplicative, logical: false }],
  ['%', { precedence: PRECEDENCE.multiplicative, logical: false }],
]);

export const ALLOWED_SYMBOL_OPERATORS: ReadonlySet<string> = new Set(['+', '-', '*', '/', '%', '<', '>', '<=', '>=']);
export const ASSIGNMENT_OPERATOR = '=';
