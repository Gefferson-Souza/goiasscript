export type CaseTriage = 'bug' | 'intentional' | 'control';

export interface CaseConfig {
  readonly status?: 'expected-fail';
  readonly triage?: CaseTriage;
  readonly rfc?: string;
  readonly issue?: string;
  readonly source?: string;
  readonly differential?: boolean;
}

export interface ExpectedDiagnostic {
  readonly code: string;
  readonly line: number;
  readonly column?: number;
  readonly severity?: 'error' | 'warning';
}

export interface ConformanceCase {
  readonly id: string;
  readonly input: string;
  readonly config: CaseConfig;
  readonly diagnostics: readonly ExpectedDiagnostic[];
  readonly output: string | null;
  readonly stdout: string | null;
  readonly stdin: string | null;
}

export interface ActualDiagnostic {
  readonly code: string;
  readonly severity: 'error' | 'warning';
  readonly range: { readonly start: { readonly line: number; readonly column: number } };
}

export type CompileResultLike =
  | { readonly ok: true; readonly code: string; readonly diagnostics: readonly ActualDiagnostic[] }
  | { readonly ok: false; readonly diagnostics: readonly ActualDiagnostic[] };

export type CompileFunction = (source: string) => CompileResultLike;
export type ExecuteFunction = (code: string, stdin: string | null) => Promise<string>;

export interface BlessedFiles {
  readonly output: string | null;
  readonly diagnostics: string;
  readonly stdout: string | null;
}
