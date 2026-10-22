import type { ExpressionStatement, Identifier, MemberExpression, ThrowStatement } from '../ast/ast.types.ts';
import type { RawDiagnostic } from '../lexer/token.types.ts';
import type { Resolution } from './analyzer.types.ts';

export type ResolveNode = (node: Identifier | MemberExpression) => Resolution;

export interface HintResult {
  readonly diagnostics: readonly RawDiagnostic[];
  readonly rethrowStatements: ReadonlySet<ThrowStatement>;
  readonly hasTopLevelAwait: boolean;
  readonly lastTopLevelExpression?: ExpressionStatement;
}
