import { describe, expect, it, vi } from 'vitest';
import { createHandler } from '../src/handler';
import type { HandlerDeps } from '../src/handler.types';
import { buildHealthReport } from '../src/health';
import { jsonRequest, makeConfig, makeEnv } from './helpers';

const SECRET_KEY = 'gsk_segredo_que_nao_pode_vazar';

function healthRequest(): Request {
  return jsonRequest('', { method: 'GET', path: '/health', contentLength: null, contentType: null });
}

function makeSpies() {
  const limiter = { reserve: vi.fn(), refund: vi.fn() };
  const providers = { complete: vi.fn() };
  const cache = { get: vi.fn(), put: vi.fn() };
  return { limiter, providers, cache };
}

function handlerFor(env = makeEnv({ GROQ_API_KEY: SECRET_KEY })) {
  const spies = makeSpies();
  const config = makeConfig();
  const deps: HandlerDeps = {
    limiter: spies.limiter,
    providers: spies.providers,
    cache: spies.cache,
    health: () => buildHealthReport(env, config),
    config,
    log: { warn: vi.fn(), error: vi.fn() },
  };
  return { spies, respond: () => createHandler(deps)(healthRequest(), env) };
}

describe('GET /health', () => {
  it('responde 200 com modelo e bindings', async () => {
    const { respond } = handlerFor();
    const response = await respond();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      model: makeConfig().groqModel,
      bindings: { QUOTA_LEDGER: true, ENGOIANADOR_CACHE: true, AI: false, GROQ_API_KEY: true },
    });
  });

  it('responde 503 quando falta o Durable Object', async () => {
    const env = makeEnv({ GROQ_API_KEY: SECRET_KEY, QUOTA_LEDGER: undefined });
    const response = await handlerFor(env).respond();
    expect(response.status).toBe(503);
    const body = await response.json<{ ok: boolean; bindings: Record<string, boolean> }>();
    expect(body.ok).toBe(false);
    expect(body.bindings.QUOTA_LEDGER).toBe(false);
  });

  it('responde 503 quando falta o cache KV', async () => {
    const env = makeEnv({ GROQ_API_KEY: SECRET_KEY, ENGOIANADOR_CACHE: undefined });
    expect((await handlerFor(env).respond()).status).toBe(503);
  });

  it('responde 503 quando não há nenhum provedor configurado', async () => {
    const response = await handlerFor(makeEnv()).respond();
    expect(response.status).toBe(503);
  });

  it('aceita o Workers AI como único provedor', async () => {
    const env = makeEnv({ AI: { run: () => Promise.resolve({}) } });
    expect((await handlerFor(env).respond()).status).toBe(200);
  });

  it('não expõe a chave nem valores de variável', async () => {
    const env = makeEnv({ GROQ_API_KEY: SECRET_KEY, ALLOWED_ORIGINS: 'https://playground.goiasscript.com.br' });
    const text = await (await handlerFor(env).respond()).text();
    expect(text).not.toContain(SECRET_KEY);
    expect(text).not.toContain('playground.goiasscript.com.br');
    expect(text).not.toContain('2000');
  });

  it('não chama provedor, limiter nem cache', async () => {
    const { spies, respond } = handlerFor();
    await respond();
    expect(spies.providers.complete).not.toHaveBeenCalled();
    expect(spies.limiter.reserve).not.toHaveBeenCalled();
    expect(spies.limiter.refund).not.toHaveBeenCalled();
    expect(spies.cache.get).not.toHaveBeenCalled();
    expect(spies.cache.put).not.toHaveBeenCalled();
  });
});
