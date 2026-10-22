import type { BlockStatement, ErrorNode, Expression, Statement } from '../ast/ast.types.ts';
import type { ParserState } from './parser-state.ts';

export interface Parser {
  readonly state: ParserState;
  parseExpression(minimum?: number): Expression;
  parseStatement(): Statement;
  parseBlock(): BlockStatement;
  nested<T>(start: number, parse: () => T, fallback: T): T;
  build(node: Expression): Expression;
  unexpected(): ErrorNode;
}
