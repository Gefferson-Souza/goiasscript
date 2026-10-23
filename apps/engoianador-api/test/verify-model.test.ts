import { describe, expect, it } from 'vitest';
import { runVerifyModel, verifyModel } from '../scripts/verify-model';
import type { FetchPort } from '../src/providers/provider.types';

const API_KEY = 'chave-secreta-de-teste';
const MODEL = 'modelo-ativo';

function listing(entries: readonly { readonly id: string; readonly active?: boolean }[], status = 200): FetchPort {
  return () => Promise.resolve(new Response(JSON.stringify({ data: entries }), { status }));
}

describe('verifyModel', () => {
  it('aceita modelo ativo', async () => {
    const result = await verifyModel({ apiKey: API_KEY, model: MODEL, fetchFn: listing([{ id: MODEL, active: true }]) });
    expect(result.status).toBe('ok');
  });

  it('trata ausência do campo active como ativo', async () => {
    const result = await verifyModel({ apiKey: API_KEY, model: MODEL, fetchFn: listing([{ id: MODEL }]) });
    expect(result.status).toBe('ok');
  });

  it('recusa modelo ausente da lista', async () => {
    const result = await verifyModel({ apiKey: API_KEY, model: MODEL, fetchFn: listing([{ id: 'outro' }]) });
    expect(result.status).toBe('missing');
  });

  it('recusa modelo desligado', async () => {
    const result = await verifyModel({ apiKey: API_KEY, model: MODEL, fetchFn: listing([{ id: MODEL, active: false }]) });
    expect(result.status).toBe('inactive');
  });

  it('falha de rede ou status ruim vira unreachable', async () => {
    const down: FetchPort = () => Promise.reject(new TypeError('fetch failed'));
    expect((await verifyModel({ apiKey: API_KEY, model: MODEL, fetchFn: down })).status).toBe('unreachable');
    expect((await verifyModel({ apiKey: API_KEY, model: MODEL, fetchFn: listing([], 401) })).status).toBe('unreachable');
  });

  it('sem chave pula e não chama a rede', async () => {
    let called = false;
    const fetchFn: FetchPort = () => {
      called = true;
      return Promise.resolve(new Response('{}'));
    };
    const result = await verifyModel({ apiKey: undefined, model: MODEL, fetchFn });
    expect(result.status).toBe('skipped');
    expect(called).toBe(false);
  });
});

describe('runVerifyModel', () => {
  it('sem chave pula e avisa, ou falha com --require', async () => {
    const lenient = await runVerifyModel({ apiKey: undefined, model: MODEL, require: false, fetchFn: listing([]) });
    const strict = await runVerifyModel({ apiKey: undefined, model: MODEL, require: true, fetchFn: listing([]) });
    expect(lenient.exitCode).toBe(0);
    expect(lenient.message).toMatch(/pul/i);
    expect(strict.exitCode).toBe(1);
  });

  it('falha com id inexistente ou desligado', async () => {
    const missing = await runVerifyModel({ apiKey: API_KEY, model: MODEL, require: false, fetchFn: listing([{ id: 'outro' }]) });
    const inactive = await runVerifyModel({ apiKey: API_KEY, model: MODEL, require: false, fetchFn: listing([{ id: MODEL, active: false }]) });
    expect(missing.exitCode).toBe(1);
    expect(inactive.exitCode).toBe(1);
  });

  it('a saída nunca contém a chave', async () => {
    const outcomes = await Promise.all([
      runVerifyModel({ apiKey: API_KEY, model: MODEL, require: true, fetchFn: listing([{ id: MODEL }]) }),
      runVerifyModel({ apiKey: API_KEY, model: MODEL, require: true, fetchFn: listing([], 401) }),
      runVerifyModel({ apiKey: API_KEY, model: MODEL, require: true, fetchFn: () => Promise.reject(new Error(`falhou com ${API_KEY}`)) }),
    ]);
    for (const outcome of outcomes) expect(outcome.message).not.toContain(API_KEY);
  });

  it('aceita modelo ativo com saída zero', async () => {
    const ok = await runVerifyModel({ apiKey: API_KEY, model: MODEL, require: true, fetchFn: listing([{ id: MODEL }]) });
    expect(ok.exitCode).toBe(0);
  });
});
