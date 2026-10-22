import type { CompileSuccess, Tone } from '@goiasscript/compiler';
import type { ExitCode } from '../exit-codes.types.ts';
import type { AnyDiagnostic } from '../diagnostics/diagnostic.types.ts';
import type { SourceInput } from '../paths/paths.types.ts';

export interface CompileRequest {
  readonly inputArg: string;
  readonly tone: Tone;
  readonly json: boolean;
}

export type CompiledSource =
  | {
      readonly kind: 'ok';
      readonly result: CompileSuccess;
      readonly source: string;
      readonly input: SourceInput;
      readonly outputStem: string | null;
    }
  | { readonly kind: 'failed'; readonly exit: ExitCode };

export interface ReportRequest {
  readonly file: string;
  readonly source: string | null;
  readonly diagnostics: readonly AnyDiagnostic[];
  readonly json: boolean;
}

export interface ToolFailure {
  readonly code: string;
  readonly detail: string;
  readonly args?: Readonly<Record<string, string>>;
}
