import type { Diagnostic } from '@goiasscript/compiler';
import type { CompileView } from '../compile-service.types.ts';
import type { RunViewAction } from './run-state-view.types.ts';
import type { RunnerClient } from './runner-client.types.ts';

export interface StartRunDeps {
  readonly source: string;
  readonly fileName: string;
  readonly compile: (source: string) => Promise<CompileView>;
  readonly runner: Pick<RunnerClient, 'run'> | null;
  readonly fallbackDiagnostic: Diagnostic;
  readonly dispatch: (action: RunViewAction) => void;
}
