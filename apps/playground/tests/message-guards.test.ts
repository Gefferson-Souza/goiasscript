import { describe, expect, it } from 'vitest';
import { RUN_LIMITS } from '../config/run-limits.constants.ts';
import { parseRunnerMessage } from '../lib/run/message-guards.ts';

const parse = (data: unknown) => parseRunnerMessage(data, RUN_LIMITS);

describe('guarda das mensagens do runner', () => {
  it('aceita exatamente os cinco tipos do protocolo', () => {
    expect(parse({ type: 'gs:pronto' })).toEqual({ type: 'gs:pronto' });
    expect(parse({ type: 'gs:log', runId: 1, stream: 'out', text: 'oi' })).toEqual({ type: 'gs:log', runId: 1, stream: 'out', text: 'oi' });
    expect(parse({ type: 'gs:log', runId: 0, stream: 'err', text: '' })).toEqual({ type: 'gs:log', runId: 0, stream: 'err', text: '' });
    expect(parse({ type: 'gs:pergunta', prompt: 'Nome?' })).toEqual({ type: 'gs:pergunta', prompt: 'Nome?' });
    expect(parse({ type: 'gs:terminou', runId: 3 })).toEqual({ type: 'gs:terminou', runId: 3 });
    expect(parse({ type: 'gs:falhou', runId: 2, stack: 'pilha', errorName: 'TypeError' })).toEqual({
      type: 'gs:falhou',
      runId: 2,
      stack: 'pilha',
      errorName: 'TypeError',
    });
  });

  it.each([
    ['null', null],
    ['array', [{ type: 'gs:pronto' }]],
    ['string', 'gs:pronto'],
    ['número', 7],
    ['objeto sem type', { runId: 1 }],
    ['type desconhecido', { type: 'gs:outra' }],
    ['type que é nome do protótipo', { type: 'constructor' }],
    ['type que não é texto', { type: 1 }],
    ['runId fracionário', { type: 'gs:terminou', runId: 1.5 }],
    ['runId negativo', { type: 'gs:terminou', runId: -1 }],
    ['runId em texto', { type: 'gs:terminou', runId: '1' }],
    ['runId infinito', { type: 'gs:terminou', runId: Infinity }],
    ['log com text que não é texto', { type: 'gs:log', runId: 1, stream: 'out', text: 5 }],
    ['log com stream inválido', { type: 'gs:log', runId: 1, stream: 'debug', text: 'x' }],
    ['pergunta sem prompt', { type: 'gs:pergunta' }],
    ['falha sem stack', { type: 'gs:falhou', runId: 1, errorName: 'Error' }],
  ])('rejeita %s', (_label, data) => {
    expect(parse(data)).toBeNull();
  });

  it('corta a pergunta no teto em vez de rejeitar', () => {
    const message = parse({ type: 'gs:pergunta', prompt: 'a'.repeat(RUN_LIMITS.maxPromptChars + 50) });
    expect(message).toEqual({ type: 'gs:pergunta', prompt: 'a'.repeat(RUN_LIMITS.maxPromptChars) });
  });

  it('corta a pilha em 20.000 caracteres', () => {
    const message = parse({ type: 'gs:falhou', runId: 1, stack: 'p'.repeat(25_000), errorName: 'Error' });
    expect(message?.type === 'gs:falhou' ? message.stack.length : -1).toBe(20_000);
  });

  it('carrega código e linha da trava de laço quando válidos', () => {
    const message = parse({ type: 'gs:falhou', runId: 1, stack: 's', errorName: 'Error', gsCode: 'GS0701', gsLine: 4 });
    expect(message).toMatchObject({ gsCode: 'GS0701', gsLine: 4 });
    expect(parse({ type: 'gs:falhou', runId: 1, stack: 's', errorName: 'Error', gsCode: 9, gsLine: -2 })).toEqual({
      type: 'gs:falhou',
      runId: 1,
      stack: 's',
      errorName: 'Error',
    });
  });

  it('não devolve campos extras nem herda do protótipo', () => {
    const polluted = Object.create({ runId: 1, stream: 'out', text: 'herdado' }) as Record<string, unknown>;
    Object.assign(polluted, { type: 'gs:log' });
    expect(parse(polluted)).toBeNull();
    const withExtra = parse({ type: 'gs:terminou', runId: 1, extra: 'x', __proto__: { runId: 9 } });
    expect(withExtra).toEqual({ type: 'gs:terminou', runId: 1 });
    expect(Object.keys(withExtra ?? {})).toEqual(['type', 'runId']);
  });
});
