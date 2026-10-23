import type { Diagnostic } from '@goiasscript/compiler';
import type { CompileView } from '../compile-service.types.ts';
import type { RunViewAction } from './run-state-view.types.ts';
import type { StartRunDeps } from './start-run.types.ts';

async function compileSafely(deps: StartRunDeps): Promise<CompileView | null> {
  try {
    return await deps.compile(deps.source);
  } catch {
    return null;
  }
}

const firstError = (view: CompileView): Diagnostic | undefined =>
  view.result.ok ? undefined : view.result.diagnostics.find((diagnostic) => diagnostic.severity === 'error');

const failureOf = (diagnostic: Diagnostic): RunViewAction => ({ kind: 'failed', diagnostic });

export async function startRun(deps: StartRunDeps): Promise<void> {
  const { dispatch, runner, fallbackDiagnostic } = deps;
  dispatch({ kind: 'start' });
  const built = await compileSafely(deps);
  if (built === null) {
    dispatch(failureOf(fallbackDiagnostic));
    return;
  }
  if (!built.result.ok) {
    dispatch(failureOf(firstError(built) ?? fallbackDiagnostic));
    return;
  }
  runner?.run({ compiled: built.result, source: deps.source, fileName: deps.fileName }, dispatch);
}
