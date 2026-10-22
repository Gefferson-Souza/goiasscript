import type { SourceMapV3 } from './sourcemap/source-map.types.ts';

export type { SourceMapV3 };
export type CompileTarget = 'module' | 'repl' | 'playground';
export type Tone = 'raiz' | 'neutro';
export type Severity = 'error' | 'warning';
export type BindingKind = 'uai' | 'trem' | 'faz_trem' | 'arruma_trem';

export interface SourcePosition {
  readonly offset: number;
  readonly line: number;
  readonly column: number;
}

export interface SourceRange {
  readonly start: SourcePosition;
  readonly end: SourcePosition;
}

export interface LineRange {
  readonly startLine: number;
  readonly endLine: number;
}

export interface SessionBinding {
  readonly name: string;
  readonly kind: BindingKind;
}

export interface ReplSession {
  readonly bindings: readonly SessionBinding[];
  readonly members: readonly string[];
}

export interface DiagnosticExplanation {
  readonly code: string;
  readonly title: string;
  readonly explanation: string;
  readonly example: string;
  readonly lesson: string;
}

export interface Diagnostic {
  readonly code: string;
  readonly severity: Severity;
  readonly range: SourceRange;
  readonly message: string;
  readonly help?: string;
  readonly lesson?: string;
}

export interface CompileOptions {
  readonly fileName?: string;
  readonly target?: CompileTarget;
  readonly tone?: Tone;
  readonly sourceMap?: boolean;
  readonly session?: ReplSession;
  readonly loopLimit?: number;
}

export interface CompileSuccess {
  readonly ok: true;
  readonly code: string;
  readonly map: SourceMapV3 | null;
  readonly diagnostics: readonly Diagnostic[];
  readonly helperRange: LineRange | null;
  readonly session: ReplSession | null;
  readonly echo: boolean;
  readonly awaitable: boolean;
}

export interface CompileFailure {
  readonly ok: false;
  readonly diagnostics: readonly Diagnostic[];
  readonly incomplete: boolean;
}

export type CompileResult = CompileSuccess | CompileFailure;

export interface OptimizeResult {
  readonly code: string;
  readonly map: SourceMapV3 | null;
}

export interface RuntimeErrorContext {
  readonly map: SourceMapV3 | null;
  readonly helperRange: LineRange | null;
  readonly fileName: string;
  readonly source: string;
}
