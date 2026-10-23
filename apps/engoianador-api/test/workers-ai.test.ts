import { describe, expect, it } from 'vitest';
import type { AiBinding } from '../src/env.types';
import { createWorkersAiProvider } from '../src/providers/workers-ai';

const MODEL = '@cf/modelo/de-teste';
const NEVER_ABORTED = new AbortController().signal;
const SHORT_TIMEOUT_MS = 20;
const LONG_TIMEOUT_MS = 5000;

function aiReturning(output: unknown): { readonly ai: AiBinding; readonly models: string[] } {
  const models: string[] = [];
  const ai: AiBinding = {
    run: (model) => {
      models.push(model);
      return Promise.resolve(output);
    },
  };
  return { ai, models };
}

describe('createWorkersAiProvider', () => {
  it('sucesso devolve o texto sem aspas e usa o modelo configurado', async () => {
    const { ai, models } = aiReturning({ response: '“Bão demais, sô.”' });
    const result = await createWorkersAiProvider({ ai, model: MODEL, timeoutMs: LONG_TIMEOUT_MS }).complete('oi', NEVER_ABORTED);
    expect(result).toEqual({ ok: true, text: 'Bão demais, sô.', provider: 'workers-ai' });
    expect(models).toEqual([MODEL]);
  });

  it('sem binding vira model-disabled', async () => {
    const result = await createWorkersAiProvider({ ai: undefined, model: MODEL, timeoutMs: LONG_TIMEOUT_MS }).complete('oi', NEVER_ABORTED);
    expect(result).toEqual({ ok: false, failure: 'model-disabled', provider: 'workers-ai' });
  });

  it('resposta vazia vira empty', async () => {
    const { ai } = aiReturning({ response: '' });
    const result = await createWorkersAiProvider({ ai, model: MODEL, timeoutMs: LONG_TIMEOUT_MS }).complete('oi', NEVER_ABORTED);
    expect(result).toEqual({ ok: false, failure: 'empty', provider: 'workers-ai' });
  });

  it('formato inesperado vira empty', async () => {
    const { ai } = aiReturning(null);
    const result = await createWorkersAiProvider({ ai, model: MODEL, timeoutMs: LONG_TIMEOUT_MS }).complete('oi', NEVER_ABORTED);
    expect(result).toEqual({ ok: false, failure: 'empty', provider: 'workers-ai' });
  });

  it('erro do binding vira server-error', async () => {
    const ai: AiBinding = { run: () => Promise.reject(new Error('boom')) };
    const result = await createWorkersAiProvider({ ai, model: MODEL, timeoutMs: LONG_TIMEOUT_MS }).complete('oi', NEVER_ABORTED);
    expect(result).toEqual({ ok: false, failure: 'server-error', provider: 'workers-ai' });
  });

  it('timeout vira timeout', async () => {
    const ai: AiBinding = { run: () => new Promise(() => undefined) };
    const result = await createWorkersAiProvider({ ai, model: MODEL, timeoutMs: SHORT_TIMEOUT_MS }).complete('oi', NEVER_ABORTED);
    expect(result).toEqual({ ok: false, failure: 'timeout', provider: 'workers-ai' });
  });
});
