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
