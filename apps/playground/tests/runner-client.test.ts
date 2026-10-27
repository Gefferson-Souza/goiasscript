import { translateRuntimeError, type CompileSuccess } from '@goiasscript/compiler';
import { describe, expect, it } from 'vitest';
import { RUN_LIMITS } from '../config/run-limits.constants.ts';
import type { RunLimits } from '../config/run-limits.types.ts';
import { createRunnerClient } from '../lib/run/runner-client.ts';
import type { RunEvent } from '../lib/run/runner-client.types.ts';
import { FakeTimers, FakeWorker } from './support/fake-worker.ts';

const SOURCE = 'linha um\nlinha dois\nlinha tres';

const compiledOf = (code: string): CompileSuccess => ({
  ok: true,
  code,
  map: null,
  diagnostics: [],
  helperRange: null,
  session: null,
  echo: false,
  awaitable: true,
});

const flushMicrotasks = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

function createHarness(limits: RunLimits = RUN_LIMITS, loadTranslator: () => Promise<typeof translateRuntimeError> = () => Promise.resolve(translateRuntimeError)) {
  const timers = new FakeTimers();
  const workers: FakeWorker[] = [];
  const events: RunEvent[] = [];
  const client = createRunnerClient({
    createWorker: () => {
      const worker = new FakeWorker();
      workers.push(worker);
      return worker;
    },
    limits,
    now: timers.now,
    timers,
    loadTranslator,
  });
  return {
    client,
    timers,
    workers,
    events,
    get worker(): FakeWorker {
      const last = workers.at(-1);
      if (last === undefined) throw new Error('nenhum Worker criado');
      return last;
    },
    onEvent: (event: RunEvent) => {
      events.push(event);
    },
    request: (code: string) => ({ compiled: compiledOf(code), source: SOURCE, fileName: 'main.gs' }),
  };
}

const startRun = (harness: ReturnType<typeof createHarness>): void => {
  harness.client.run(harness.request('prosa("oi")'), harness.onEvent);
};

describe('cliente do runner', () => {
  it('posta o código ao Worker com o runId da execução', () => {
    const harness = createHarness();
    startRun(harness);
    expect(harness.worker.posted).toEqual([{ type: 'gs:executar', runId: 1, code: 'prosa("oi")' }]);
  });

  it('termina a execução depois do tempo ocioso que segue o fim do módulo', () => {
    const harness = createHarness();
    startRun(harness);
    harness.worker.emit({ type: 'gs:log', runId: 1, stream: 'out', text: 'oi' });
    harness.worker.emit({ type: 'gs:terminou', runId: 1 });
    harness.timers.advance(RUN_LIMITS.idleMs - 1);
    expect(harness.events).toEqual([{ kind: 'out', text: 'oi' }]);
    harness.timers.advance(1);
    expect(harness.events).toEqual([{ kind: 'out', text: 'oi' }, { kind: 'finished' }]);
    expect(harness.worker.terminated).toBe(true);
  });

  it('saída depois do fim do módulo (temporizador do aluno) reinicia a janela ociosa', () => {
    const harness = createHarness();
    startRun(harness);
    harness.worker.emit({ type: 'gs:terminou', runId: 1 });
    harness.timers.advance(RUN_LIMITS.idleMs - 1);
    harness.worker.emit({ type: 'gs:log', runId: 1, stream: 'out', text: 'tarde' });
    harness.timers.advance(RUN_LIMITS.idleMs - 1);
    expect(harness.events).toEqual([{ kind: 'out', text: 'tarde' }]);
    harness.timers.advance(1);
    expect(harness.events.at(-1)).toEqual({ kind: 'finished' });
  });

  it('termina por silêncio do Worker mesmo sem gs:terminou', () => {
    const harness = createHarness();
    startRun(harness);
    harness.worker.emit({ type: 'gs:log', runId: 1, stream: 'out', text: 'oi' });
    harness.timers.advance(RUN_LIMITS.idleMs - 1);
    expect(harness.events).toEqual([{ kind: 'out', text: 'oi' }]);
    harness.timers.advance(1);
    expect(harness.events.at(-1)).toEqual({ kind: 'finished' });
    expect(harness.worker.terminated).toBe(true);
  });

  it('antes de qualquer mensagem do Worker só o tempo máximo encerra', () => {
    const harness = createHarness();
    startRun(harness);
    harness.timers.advance(RUN_LIMITS.maxRunMs - 1);
    expect(harness.events).toEqual([]);
    harness.timers.advance(1);
    expect(harness.events).toEqual([{ kind: 'timeout' }]);
  });

  it('mensagem de outra execução é ignorada (runId diferente)', () => {
    const harness = createHarness();
    startRun(harness);
    harness.worker.emit({ type: 'gs:log', runId: 99, stream: 'out', text: 'intruso' });
    harness.worker.emit({ type: 'gs:terminou', runId: 99 });
    harness.worker.emit({ type: 'gs:falhou', runId: 99, stack: 's', errorName: 'Error' });
    harness.timers.advance(RUN_LIMITS.idleMs);
    expect(harness.events).toEqual([]);
  });

  it('ignora lixo que não é mensagem do protocolo', () => {
    const harness = createHarness();
    startRun(harness);
    harness.worker.emit({ type: 'gs:log', runId: 1, stream: 'out', text: 5 });
    harness.worker.emit('texto');
    harness.worker.emit(null);
    expect(harness.events).toEqual([]);
  });

  it('o programa que forja gs:terminou só encerra a própria execução', () => {
    const harness = createHarness();
    startRun(harness);
    harness.worker.emit({ type: 'gs:terminou', runId: 1 });
    harness.worker.emit({ type: 'gs:terminou', runId: 1 });
    harness.timers.advance(RUN_LIMITS.idleMs * 3);
    expect(harness.events).toEqual([{ kind: 'finished' }]);
    expect(harness.worker.terminateCount).toBe(1);
  });

  it('pergunta pendente suspende os relógios e responde por answer()', () => {
    const harness = createHarness();
    startRun(harness);
    harness.worker.emit({ type: 'gs:terminou', runId: 1 });
    harness.worker.emit({ type: 'gs:pergunta', prompt: 'Nome?' });
    harness.timers.advance(60_000);
    expect(harness.events).toEqual([{ kind: 'ask', prompt: 'Nome?' }]);
    harness.client.answer('Ana');
    expect(harness.worker.posted.at(-1)).toEqual({ type: 'gs:resposta', value: 'Ana' });
    harness.worker.emit({ type: 'gs:log', runId: 1, stream: 'out', text: 'Oi, Ana' });
    harness.timers.advance(RUN_LIMITS.idleMs);
    expect(harness.events.at(-1)).toEqual({ kind: 'finished' });
  });

  it('o tempo parado na pergunta não gasta o tempo máximo', () => {
    const harness = createHarness();
    startRun(harness);
    harness.timers.advance(RUN_LIMITS.maxRunMs - 1_000);
    harness.worker.emit({ type: 'gs:pergunta', prompt: 'Nome?' });
    harness.timers.advance(120_000);
    harness.client.answer('Ana');
    for (let elapsed = 0; elapsed < 900; elapsed += 100) {
      harness.worker.emit({ type: 'gs:log', runId: 1, stream: 'out', text: '.' });
      harness.timers.advance(100);
    }
    harness.timers.advance(99);
    expect(harness.events.some((event) => event.kind === 'timeout')).toBe(false);
    harness.timers.advance(1);
    expect(harness.events.at(-1)).toEqual({ kind: 'timeout' });
  });

  it('answer() sem pergunta pendente não posta nada ao Worker', () => {
    const harness = createHarness();
    startRun(harness);
    harness.client.answer('Ana');
    expect(harness.worker.posted).toHaveLength(1);
  });

  it('segunda pergunta enquanto a primeira está pendente é ignorada', () => {
    const harness = createHarness();
    startRun(harness);
    harness.worker.emit({ type: 'gs:pergunta', prompt: 'um?' });
    harness.worker.emit({ type: 'gs:pergunta', prompt: 'dois?' });
    expect(harness.events).toEqual([{ kind: 'ask', prompt: 'um?' }]);
  });

  it('estoura o tempo máximo mesmo com saída constante', () => {
    const harness = createHarness();
    startRun(harness);
    for (let elapsed = 0; elapsed < RUN_LIMITS.maxRunMs; elapsed += 100) {
      harness.worker.emit({ type: 'gs:log', runId: 1, stream: 'out', text: '.' });
      harness.timers.advance(100);
    }
    expect(harness.events.at(-1)).toEqual({ kind: 'timeout' });
    expect(harness.worker.terminated).toBe(true);
  });

  it('falha traduzida: a trava de laço vira GS0701 na linha do .gs', async () => {
    const harness = createHarness();
    startRun(harness);
    harness.worker.emit({ type: 'gs:falhou', runId: 1, stack: 'Error: GS0701', errorName: 'Error', gsCode: 'GS0701', gsLine: 2 });
    await flushMicrotasks();
    const event = harness.events[0];
    expect(event?.kind).toBe('failed');
    expect(event?.kind === 'failed' ? [event.diagnostic.code, event.diagnostic.range.start.line] : []).toEqual(['GS0701', 2]);
    expect(harness.worker.terminated).toBe(true);
  });

  it('falha traduzida: erro comum usa a linha da pilha', async () => {
    const harness = createHarness();
    startRun(harness);
    harness.worker.emit({ type: 'gs:falhou', runId: 1, stack: 'TypeError: x\n    at blob:null/abc:3:5', errorName: 'TypeError' });
    await flushMicrotasks();
    const event = harness.events[0];
    expect(event?.kind === 'failed' ? [event.diagnostic.code, event.diagnostic.range.start.line] : []).toEqual(['GS0710', 3]);
  });

  it('stop() encerra, emite stopped e ignora mensagens posteriores', () => {
    const harness = createHarness();
    startRun(harness);
    harness.client.stop();
    harness.worker.emit({ type: 'gs:log', runId: 1, stream: 'out', text: 'tarde' });
    harness.worker.emit({ type: 'gs:terminou', runId: 1 });
    harness.client.stop();
    harness.timers.advance(RUN_LIMITS.maxRunMs);
    expect(harness.events).toEqual([{ kind: 'stopped' }]);
    expect(harness.worker.terminateCount).toBe(1);
  });

  it('segunda run() encerra a anterior antes de criar outro Worker', () => {
    const harness = createHarness();
    startRun(harness);
    const first = harness.worker;
    startRun(harness);
    expect(first.terminateCount).toBe(1);
    expect(harness.workers).toHaveLength(2);
    expect(harness.worker.posted[0]).toMatchObject({ runId: 2 });
    first.emit({ type: 'gs:log', runId: 1, stream: 'out', text: 'fantasma' });
    expect(harness.events).toEqual([]);
  });

  it('corta a saída gigante, avisa e encerra a execução', () => {
    const harness = createHarness({ ...RUN_LIMITS, maxLogLines: 2 });
    startRun(harness);
    ['a', 'b', 'c', 'd'].forEach((text) => {
      harness.worker.emit({ type: 'gs:log', runId: 1, stream: 'out', text });
    });
    expect(harness.events).toEqual([{ kind: 'out', text: 'a' }, { kind: 'out', text: 'b' }, { kind: 'truncated', reason: 'lines' }, { kind: 'finished' }]);
    expect(harness.worker.terminated).toBe(true);
  });

  it('mostra sequência de controle como texto visível', () => {
    const harness = createHarness();
    startRun(harness);
    harness.worker.emit({ type: 'gs:log', runId: 1, stream: 'err', text: '\u001b[31mX' });
    harness.worker.emit({ type: 'gs:pergunta', prompt: 'a‮b' });
    expect(harness.events).toEqual([{ kind: 'err', text: '\\u{1b}[31mX' }, { kind: 'ask', prompt: 'a\\u{202e}b' }]);
  });

  it('dispose() cancela os temporizadores e encerra o Worker sem evento', () => {
    const harness = createHarness();
    startRun(harness);
    harness.client.dispose();
    expect(harness.worker.terminated).toBe(true);
    expect(harness.timers.pendingCount).toBe(0);
    harness.worker.emit({ type: 'gs:log', runId: 1, stream: 'out', text: 'x' });
    expect(harness.events).toEqual([]);
  });

  it('run() depois de dispose() não cria Worker', () => {
    const harness = createHarness();
    harness.client.dispose();
    startRun(harness);
    expect(harness.workers).toHaveLength(0);
  });

  it('pergunta forjada que nunca é respondida não escapa do teto absoluto', () => {
    const harness = createHarness();
    startRun(harness);
    harness.worker.emit({ type: 'gs:pergunta', prompt: 'forjada' });
    harness.timers.advance(RUN_LIMITS.maxRunMs + RUN_LIMITS.maxAskWaitMs - 1);
    expect(harness.events).toEqual([{ kind: 'ask', prompt: 'forjada' }]);
    harness.timers.advance(1);
    expect(harness.events.at(-1)).toEqual({ kind: 'timeout' });
    expect(harness.worker.terminated).toBe(true);
  });

  it('falha ao carregar o runner vira diagnóstico em vez de esperar o tempo máximo', () => {
    const harness = createHarness();
    startRun(harness);
    harness.worker.emitError('Failed to load');
    expect(harness.events).toHaveLength(1);
    expect(harness.events[0]).toMatchObject({ kind: 'failed', diagnostic: { severity: 'error' } });
    expect(harness.worker.terminated).toBe(true);
    harness.timers.advance(RUN_LIMITS.maxRunMs);
    expect(harness.events).toHaveLength(1);
  });

  it('erro assíncrono depois de pronto chega ao host como falha', async () => {
    const harness = createHarness();
    startRun(harness);
    harness.worker.emit({ type: 'gs:pronto' });
    harness.worker.emitError('Uncaught Error: boom');
    await flushMicrotasks();
    expect(harness.events.at(-1)).toMatchObject({ kind: 'failed' });
    expect(harness.worker.terminated).toBe(true);
  });

  it('mensagem ilegível do Worker encerra a execução com falha', () => {
    const harness = createHarness();
    startRun(harness);
    harness.worker.emitMessageError();
    expect(harness.events.at(-1)).toMatchObject({ kind: 'failed' });
    expect(harness.worker.terminated).toBe(true);
  });

  it('erro do Worker depois do encerramento é ignorado', () => {
    const harness = createHarness();
    startRun(harness);
    harness.client.stop();
    harness.worker.emitError('tarde');
    expect(harness.events).toEqual([{ kind: 'stopped' }]);
  });

  it('falha ao carregar o tradutor ainda encerra a execução com diagnóstico', async () => {
    const harness = createHarness(RUN_LIMITS, () => Promise.reject(new Error('chunk perdido')));
    startRun(harness);
    harness.worker.emit({ type: 'gs:falhou', runId: 1, stack: 'Error: x', errorName: 'Error' });
    await flushMicrotasks();
    expect(harness.events).toHaveLength(1);
    expect(harness.events[0]).toMatchObject({ kind: 'failed', diagnostic: { severity: 'error' } });
    expect(harness.worker.terminated).toBe(true);
  });

  it('falha com tradutor pendente: termina o Worker na hora e ignora o que chegar depois', async () => {
    let resolveTranslator: (translate: typeof translateRuntimeError) => void = () => undefined;
    const pending = new Promise<typeof translateRuntimeError>((resolve) => {
      resolveTranslator = resolve;
    });
    const harness = createHarness(RUN_LIMITS, () => pending);
    startRun(harness);
    harness.worker.emit({ type: 'gs:falhou', runId: 1, stack: 'Error: x', errorName: 'Error' });
    expect(harness.worker.terminated).toBe(true);
    harness.worker.emit({ type: 'gs:terminou', runId: 1 });
    harness.timers.advance(RUN_LIMITS.maxRunMs + RUN_LIMITS.maxAskWaitMs);
    expect(harness.events).toEqual([]);
    resolveTranslator(translateRuntimeError);
    await flushMicrotasks();
    expect(harness.events).toHaveLength(1);
    expect(harness.events[0]).toMatchObject({ kind: 'failed' });
    expect(harness.worker.terminateCount).toBe(1);
  });
});
