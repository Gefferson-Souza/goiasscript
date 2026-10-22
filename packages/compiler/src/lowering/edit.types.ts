import type { CompileTarget, ReplSession } from '../api.types.ts';
import type { AnalysisResult } from '../analyzer/analyzer.types.ts';
import type { SourceText } from '../source/source.types.ts';

export interface Edit {
  readonly start: number;
  readonly end: number;
  readonly text: string;
  readonly order: number;
}

export interface MappingSegment {
  readonly generatedOffset: number;
  readonly originalOffset: number | null;
  readonly length: number;
  readonly kind: 'copy' | 'replace' | 'insert';
}

export interface LoweringResult {
  readonly edits: readonly Edit[];
  readonly helpers: readonly string[];
}

export interface EditContext {
  readonly source: SourceText;
  readonly analysis: AnalysisResult;
  readonly target: CompileTarget;
  readonly nextOrder: () => number;
  readonly session?: ReplSession;
}

export interface LowerOptions {
  readonly target: CompileTarget;
  readonly loopLimit?: number;
  readonly session?: ReplSession;
}
