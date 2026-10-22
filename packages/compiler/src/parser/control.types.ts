import type { Expression, VariableDeclaration } from '../ast/ast.types.ts';

export interface ClassicForParts {
  readonly kind: 'classic';
  readonly init: VariableDeclaration | Expression | null;
  readonly test: Expression | null;
  readonly update: Expression | null;
}

export interface EachForParts {
  readonly kind: 'each';
  readonly type: 'ForOfStatement' | 'ForInStatement';
  readonly left: VariableDeclaration;
  readonly right: Expression;
}

export type ForParts = ClassicForParts | EachForParts;
