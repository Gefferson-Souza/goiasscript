import type { StdlibEntry } from '@goiasscript/language';
import type { CompileTarget, ReplSession, SessionBinding } from '../api.types.ts';
import type { ExpressionStatement, Identifier, MemberExpression, ThrowStatement } from '../ast/ast.types.ts';
import type { RawDiagnostic } from '../lexer/token.types.ts';

export type ResolutionKind = 'library' | 'program' | 'session' | 'unresolved';

// Membro com nome que existe na biblioteca e no programa: chamada `x.nome(...)` resolve para a biblioteca;
// leitura sem chamada (`x.nome`) resolve para o programa. Propriedade reservada da biblioteca vence sempre.
export interface Resolution {
  readonly kind: ResolutionKind;
  readonly entry?: StdlibEntry;
}

export interface AnalyzeOptions {
  readonly target: CompileTarget;
  readonly session?: ReplSession;
}

export interface AnalysisResult {
  readonly diagnostics: readonly RawDiagnostic[];
  readonly resolutionOf: (node: Identifier | MemberExpression) => Resolution;
  readonly declaredMembers: ReadonlySet<string>;
  readonly topLevelBindings: readonly SessionBinding[];
  readonly rethrowStatements: ReadonlySet<ThrowStatement>;
  readonly hasTopLevelAwait: boolean;
  readonly lastTopLevelExpression?: ExpressionStatement;
}
