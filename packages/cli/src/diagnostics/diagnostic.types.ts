import type { Diagnostic, Severity } from '@goiasscript/compiler';

export interface ToolDiagnostic {
  readonly code: string;
  readonly severity: Severity;
  readonly message: string;
  readonly help?: string;
  readonly detail?: string;
}

export type AnyDiagnostic = Diagnostic | ToolDiagnostic;

export interface RenderRequest {
  readonly diagnostic: AnyDiagnostic;
  readonly fileName: string;
  readonly source: string | null;
}

export interface JsonReportInput {
  readonly file: string;
  readonly diagnostics: readonly AnyDiagnostic[];
}
