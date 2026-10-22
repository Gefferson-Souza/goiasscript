import type { AnalysisResult } from '../../src/analyzer/analyzer.types.ts';
import type { CompileTarget, ReplSession } from '../../src/api.types.ts';
import type { ParseResult } from '../../src/ast/ast.types.ts';
import type { SourceText } from '../../src/source/source.types.ts';

export interface AnalyzeOptions {
  readonly target?: CompileTarget;
  readonly session?: ReplSession;
}

export interface AnalyzedSource {
  readonly analysis: AnalysisResult;
  readonly codes: readonly string[];
  readonly parsed: ParseResult;
  readonly source: SourceText;
}
