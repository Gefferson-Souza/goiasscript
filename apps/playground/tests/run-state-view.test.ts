import type { Diagnostic } from '@goiasscript/compiler';
import { describe, expect, it } from 'vitest';
import { INITIAL_RUN_VIEW, reduceRunView } from '../lib/run/run-state-view.ts';
import type { RunViewAction, RunViewState } from '../lib/run/run-state-view.types.ts';

const diagnostic = {
  code: 'GS0701',
  severity: 'error',
  message: 'Ô sô, esse laço rodou demais (linha 3).',
  help: 'Confere a condição do laço.',
  range: { start: { offset: 0, line: 3, column: 1 }, end: { offset: 1, line: 3, column: 2 } },
} as unknown as Diagnostic;

const play = (actions: readonly RunViewAction[], from: RunViewState = INITIAL_RUN_VIEW): RunViewState =>
  actions.reduce(reduceRunView, from);

describe('estado da tela de execução', () => {
  it('começa parado e sem nada na tela', () => {
    expect(INITIAL_RUN_VIEW).toEqual({ status: 'idle', lines: [], pendingPrompt: null, notice: null });
  });

  it('start limpa a execução anterior e passa a rodando', () => {
    const dirty = play([{ kind: 'start' }, { kind: 'out', text: 'a' }, { kind: 'finished' }]);
    expect(play([{ kind: 'start' }], dirty)).toEqual({ status: 'running', lines: [], pendingPrompt: null, notice: null });
  });

  it('out e err empilham na ordem, com o fluxo de cada linha', () => {
    const state = play([{ kind: 'start' }, { kind: 'out', text: 'um' }, { kind: 'err', text: 'dois' }, { kind: 'out', text: 'três' }]);
    expect(state.lines).toEqual([
      { stream: 'out', text: 'um' },
      { stream: 'err', text: 'dois' },
      { stream: 'out', text: 'três' },
    ]);
  });

  it('ask define a pergunta pendente e answer limpa', () => {
    const asking = play([{ kind: 'start' }, { kind: 'ask', prompt: 'Seu nome?' }]);
    expect(asking).toMatchObject({ status: 'asking', pendingPrompt: 'Seu nome?' });
    expect(play([{ kind: 'answer' }], asking)).toMatchObject({ status: 'running', pendingPrompt: null });
  });

  it('answer sem pergunta pendente não muda nada', () => {
    const running = play([{ kind: 'start' }]);
    expect(play([{ kind: 'answer' }], running)).toBe(running);
  });

  it('truncated avisa o motivo em goianês', () => {
    const lines = play([{ kind: 'start' }, { kind: 'truncated', reason: 'lines' }]);
    const chars = play([{ kind: 'start' }, { kind: 'truncated', reason: 'chars' }]);
    expect(lines.notice).toMatch(/linha/u);
    expect(chars.notice).toMatch(/texto/u);
    expect(lines.notice).not.toBe(chars.notice);
  });

  it('failed mostra a mensagem e a ajuda do diagnóstico', () => {
    const state = play([{ kind: 'start' }, { kind: 'failed', diagnostic }]);
    expect(state.status).toBe('failed');
    expect(state.notice).toContain(diagnostic.message);
    expect(state.notice).toContain('Confere a condição do laço.');
  });

  it('failed sem ajuda mostra só a mensagem', () => {
    const withoutHelp = { code: diagnostic.code, severity: diagnostic.severity, message: diagnostic.message, range: diagnostic.range } as Diagnostic;
    const state = play([{ kind: 'start' }, { kind: 'failed', diagnostic: withoutHelp }]);
    expect(state.notice).toBe(diagnostic.message);
  });

  it('failed sem linha na mensagem prefixa a linha do .gs', () => {
    const typeError = { code: 'GS0702', severity: 'error', message: 'Ô sô, esse trem num existe.', range: diagnostic.range } as unknown as Diagnostic;
    const state = play([{ kind: 'start' }, { kind: 'failed', diagnostic: typeError }]);
    expect(state.notice).toBe('Linha 3: Ô sô, esse trem num existe.');
  });

  it('failed do próprio playground não inventa linha', () => {
    const host = { code: 'GS0714', severity: 'error', message: 'Eita!', range: diagnostic.range } as unknown as Diagnostic;
    expect(play([{ kind: 'start' }, { kind: 'failed', diagnostic: host }]).notice).toBe('Eita!');
  });

  it('timeout avisa que travou', () => {
    const state = play([{ kind: 'start' }, { kind: 'timeout' }]);
    expect(state.status).toBe('timeout');
    expect(state.notice).not.toBeNull();
  });

  it('finished e stopped fecham a execução e limpam a pergunta', () => {
    const asking = play([{ kind: 'start' }, { kind: 'ask', prompt: 'x?' }]);
    expect(play([{ kind: 'finished' }], asking)).toMatchObject({ status: 'finished', pendingPrompt: null });
    expect(play([{ kind: 'stopped' }], asking)).toMatchObject({ status: 'stopped', pendingPrompt: null });
  });

  it.each(['finished', 'failed', 'timeout', 'stopped'] as const)('evento depois de %s é ignorado', (terminal) => {
    const closed = play([{ kind: 'start' }, terminal === 'failed' ? { kind: 'failed', diagnostic } : { kind: terminal }]);
    expect(play([{ kind: 'out', text: 'atrasado' }, { kind: 'ask', prompt: 'p' }, { kind: 'finished' }, { kind: 'truncated', reason: 'lines' }], closed)).toBe(closed);
  });

  it('evento sem start (parado) é ignorado', () => {
    expect(play([{ kind: 'out', text: 'solto' }])).toBe(INITIAL_RUN_VIEW);
  });
});
