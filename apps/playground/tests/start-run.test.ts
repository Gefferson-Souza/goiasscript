import type { Diagnostic } from '@goiasscript/compiler';
import { describe, expect, it, vi } from 'vitest';
import type { CompileView } from '../lib/compile-service.types.ts';
import type { RunViewAction } from '../lib/run/run-state-view.types.ts';
import { startRun } from '../lib/run/start-run.ts';
import type { StartRunDeps } from '../lib/run/start-run.types.ts';

const fallbackDiagnostic = { code: 'GS0714', severity: 'error', message: 'generico' } as unknown as Diagnostic;
const warning = { code: 'GS0001', severity: 'warning', message: 'aviso' } as unknown as Diagnostic;
const error = { code: 'GS0002', severity: 'error', message: 'erro' } as unknown as Diagnostic;

const viewOf = (result: unknown): CompileView => ({ result, generatedCode: null, markers: [], hiddenMarkerCount: 0 }) as unknown as CompileView;

function setup(compile: StartRunDeps['compile']) {
  const actions: RunViewAction[] = [];
  const run = vi.fn();
  const deps: StartRunDeps = { source: 'x', fileName: 'a.gs', compile, runner: { run }, fallbackDiagnostic, dispatch: (a) => actions.push(a) };
  return { actions, run, deps };
}

describe('início da execução', () => {
  it('compilação rejeitada vira falha genérica em vez de ficar rodando', async () => {
    const { actions, run, deps } = setup(() => Promise.reject(new Error('boom')));
    await startRun(deps);
    expect(actions).toEqual([{ kind: 'start' }, { kind: 'failed', diagnostic: fallbackDiagnostic }]);
    expect(run).not.toHaveBeenCalled();
  });

  it('resultado sem sucesso e sem erro vira falha genérica', async () => {
    const { actions, deps } = setup(() => Promise.resolve(viewOf({ ok: false, diagnostics: [warning] })));
    await startRun(deps);
    expect(actions.at(-1)).toEqual({ kind: 'failed', diagnostic: fallbackDiagnostic });
  });

  it('mostra o primeiro erro de compilação', async () => {
    const { actions, deps } = setup(() => Promise.resolve(viewOf({ ok: false, diagnostics: [warning, error] })));
    await startRun(deps);
    expect(actions.at(-1)).toEqual({ kind: 'failed', diagnostic: error });
  });

  it('compilação ok entrega ao runner', async () => {
    const result = { ok: true };
    const { actions, run, deps } = setup(() => Promise.resolve(viewOf(result)));
    await startRun(deps);
    expect(actions).toEqual([{ kind: 'start' }]);
    expect(run).toHaveBeenCalledWith({ compiled: result, source: 'x', fileName: 'a.gs' }, deps.dispatch);
  });
});
