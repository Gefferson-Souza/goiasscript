import { describe, expect, it, vi } from 'vitest';
import { createCache } from '../src/cache';
import { createHandler } from '../src/handler';
import type { HandlerDeps } from '../src/handler.types';
import index from '../src/index';
import type { HealthReport, ProviderChain, QuotaLimiter } from '../src/ports.types';
import { ALLOWED_ORIGIN, jsonRequest, makeConfig, makeEnv } from './helpers';

const HEALTH: HealthReport = { ok: true, model: 'modelo-teste', bindings: { QUOTA_LEDGER: true } };
const GOIANO_MARKER = /sô|ô|uai|trem/iu;

interface Doubles {
  readonly deps: HandlerDeps;
  readonly limiter: { reserve: ReturnType<typeof vi.fn>; refund: ReturnType<typeof vi.fn> };
  readonly providers: { complete: ReturnType<typeof vi.fn> };
  readonly cache: { get: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn> };
  readonly log: { warn: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  readonly calls: string[];
}

function makeDoubles(overrides: Partial<HandlerDeps> = {}): Doubles {
  const calls: string[] = [];
  const limiter = {
    reserve: vi.fn((): Promise<unknown> => {
      calls.push('reserve');
      return Promise.resolve({ ok: true, reservation: 'r1' });
    }),
    refund: vi.fn((): Promise<void> => Promise.resolve()),
  };
  const providers = {
    complete: vi.fn((): Promise<unknown> => {
      calls.push('provider');
      return Promise.resolve({ ok: true, text: 'uai, sô', provider: 'fake' });
    }),
  };
  const cache = {
    get: vi.fn((): Promise<string | null> => {
      calls.push('cache.get');
      return Promise.resolve(null);
    }),
    put: vi.fn((): Promise<void> => {
      calls.push('cache.put');
      return Promise.resolve();
    }),
  };
  const log = { warn: vi.fn(), error: vi.fn() };
  const deps: HandlerDeps = {
    limiter: limiter as unknown as QuotaLimiter,
    providers: providers as unknown as ProviderChain,
    cache,
    health: () => HEALTH,
    config: makeConfig(),
    log,
    ...overrides,
  };
  return { deps, limiter, providers, cache, log, calls };
}

async function call(deps: HandlerDeps, request: Request, envOverrides = {}): Promise<Response> {
  return createHandler(deps)(request, makeEnv(envOverrides));
}

describe('createHandler', () => {
  it('GET /health responde sem chamar provedor nem consumir cota', async () => {
    const { deps, limiter, providers } = makeDoubles();
    const response = await call(deps, jsonRequest('', { method: 'GET', path: '/health', contentLength: null, contentType: null }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(HEALTH);
    expect(limiter.reserve).not.toHaveBeenCalled();
    expect(providers.complete).not.toHaveBeenCalled();
  });

  it('kill switch devolve 503 antes de qualquer custo', async () => {
    const { deps, limiter, providers, cache } = makeDoubles({ config: makeConfig({ killSwitch: true }) });
    const response = await call(deps, jsonRequest('{"text":"oi"}'));
    expect(response.status).toBe(503);
    expect(limiter.reserve).not.toHaveBeenCalled();
    expect(providers.complete).not.toHaveBeenCalled();
    expect(cache.get).not.toHaveBeenCalled();
  });

  it('OPTIONS devolve preflight só para origem permitida', async () => {
    const { deps } = makeDoubles();
    const allowed = await call(deps, jsonRequest('', { method: 'OPTIONS', contentLength: null, contentType: null }));
    expect(allowed.status).toBe(204);
    expect(allowed.headers.get('Access-Control-Allow-Origin')).toBe(ALLOWED_ORIGIN);
    const denied = await call(deps, jsonRequest('', { method: 'OPTIONS', origin: 'https://evil.com', contentLength: null, contentType: null }));
    expect(denied.status).toBe(403);
    expect(denied.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('não anuncia x-user-api-key no CORS', async () => {
    const { deps } = makeDoubles();
    const response = await call(deps, jsonRequest('', { method: 'OPTIONS', contentLength: null, contentType: null }));
    expect(response.headers.get('Access-Control-Allow-Headers')).not.toContain('x-user-api-key');
  });

  it('rota desconhecida devolve 404 em goianês com CORS', async () => {
    const { deps } = makeDoubles();
    const response = await call(deps, jsonRequest('{}', { path: '/outra-rota' }));
    expect(response.status).toBe(404);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ALLOWED_ORIGIN);
    expect((await response.json<{ error: string }>()).error).toMatch(GOIANO_MARKER);
  });

  it('ordem do pipeline: cache antes da reserva, reserva antes do provedor', async () => {
    const { deps, calls } = makeDoubles();
    const response = await call(deps, jsonRequest('{"text":"oi"}'));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ text: 'uai, sô' });
    expect(calls).toEqual(['cache.get', 'reserve', 'provider', 'cache.put']);
  });

  it('acerto de cache não reserva cota nem chama provedor', async () => {
    const { deps, limiter, providers, cache } = makeDoubles();
    cache.get.mockResolvedValueOnce('do cache, sô');
    const response = await call(deps, jsonRequest('{"text":"oi"}'));
    expect(await response.json()).toEqual({ text: 'do cache, sô' });
    expect(limiter.reserve).not.toHaveBeenCalled();
    expect(providers.complete).not.toHaveBeenCalled();
  });

  it('erro do cache vira acerto perdido e a requisição segue', async () => {
    const { deps, cache, providers } = makeDoubles();
    cache.get.mockRejectedValueOnce(new Error('kv fora'));
    cache.put.mockRejectedValueOnce(new Error('kv fora'));
    const response = await call(deps, jsonRequest('{"text":"oi"}'));
    expect(response.status).toBe(200);
    expect(providers.complete).toHaveBeenCalledTimes(1);
  });

  it('falha do provedor devolve a cota e responde 502 com CORS', async () => {
    const { deps, limiter, providers, cache } = makeDoubles();
    providers.complete.mockResolvedValueOnce({ ok: false, failure: 'server-error', provider: 'fake' });
    const response = await call(deps, jsonRequest('{"text":"oi"}'));
    expect(response.status).toBe(502);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ALLOWED_ORIGIN);
    expect(limiter.refund).toHaveBeenCalledWith('r1');
    expect(cache.put).not.toHaveBeenCalled();
  });

  it('limite por rede devolve 429 com Retry-After', async () => {
    const { deps, limiter, providers } = makeDoubles();
    limiter.reserve.mockResolvedValueOnce({ ok: false, reason: 'rate', retryAfterSec: 120 });
    const response = await call(deps, jsonRequest('{"text":"oi"}'));
    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('120');
    expect(providers.complete).not.toHaveBeenCalled();
  });

  it.each([['global'], ['kill-switch'], ['misconfig']] as const)('cota recusada por %s devolve 503', async (reason) => {
    const { deps, limiter } = makeDoubles();
    limiter.reserve.mockResolvedValueOnce({ ok: false, reason, retryAfterSec: 0 });
    expect((await call(deps, jsonRequest('{"text":"oi"}'))).status).toBe(503);
  });

  it('usa cf-connecting-ip como chave de rede', async () => {
    const { deps, limiter } = makeDoubles();
    const request = jsonRequest('{"text":"oi"}');
    request.headers.set('cf-connecting-ip', '203.0.113.9');
    await call(deps, request);
    expect(limiter.reserve).toHaveBeenCalledWith('203.0.113.9', expect.any(Number));
  });

  it('erro interno devolve 500 sem vazar a mensagem nem o texto', async () => {
    const { deps, providers, log } = makeDoubles();
    providers.complete.mockRejectedValueOnce(new Error('segredo-interno oi'));
    const response = await call(deps, jsonRequest('{"text":"oi"}'));
    expect(response.status).toBe(500);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ALLOWED_ORIGIN);
    expect(JSON.stringify(await response.json())).not.toContain('segredo-interno');
    expect(JSON.stringify(log.error.mock.calls)).not.toContain('segredo-interno');
  });

  it('nunca registra o texto do usuário em log', async () => {
    const { deps, providers, log, limiter } = makeDoubles();
    providers.complete.mockResolvedValueOnce({ ok: false, failure: 'timeout', provider: 'fake' });
    limiter.refund.mockRejectedValueOnce(new Error('falha'));
    await call(deps, jsonRequest('{"text":"texto-secreto-do-usuario"}'));
    expect(JSON.stringify([log.warn.mock.calls, log.error.mock.calls])).not.toContain('texto-secreto-do-usuario');
  });

  it.each([
    ['null', {}],
    ['[]', {}],
    ['"oi"', {}],
    ['{"text":42}', {}],
    ['{"text":"   "}', {}],
    ['{"text":"oi"}', { contentType: 'text/plain' }],
    ['{"text":"oi"}', { contentLength: null }],
    ['{"text":"oi"}', { contentLength: '99999' }],
    ['{"text":"oi"}', { contentLength: '3' }],
    [JSON.stringify({ text: 'a'.repeat(2001) }), { contentLength: '2020' }],
  ])('toda recusa de borda (%s, %j) vem em JSON e com CORS', async (body, options) => {
    const { deps, limiter } = makeDoubles();
    const response = await call(deps, jsonRequest(body, options));
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.headers.get('Content-Type')).toContain('application/json');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ALLOWED_ORIGIN);
    expect(limiter.reserve).not.toHaveBeenCalled();
  });
});

describe('cache real no handler', () => {
  it('acerto de cache não chama provedor nem reserva cota', async () => {
    const store = new Map<string, string>();
    const kv = {
      get: (key: string): Promise<string | null> => Promise.resolve(store.get(key) ?? null),
      put: (key: string, value: string): Promise<void> => {
        store.set(key, value);
        return Promise.resolve();
      },
    };
    const log = { warn: vi.fn(), error: vi.fn() };
    const cache = createCache({ kv, ttlSec: 3600, promptVersion: 'p1', modelId: 'm1', log });
    const { deps, limiter, providers } = makeDoubles({ cache, log });
    const first = await call(deps, jsonRequest('{"text":"oi   mundo"}'));
    const second = await call(deps, jsonRequest('{"text":" oi mundo "}'));
    expect(await first.json()).toEqual({ text: 'uai, sô' });
    expect(await second.json()).toEqual({ text: 'uai, sô' });
    expect(providers.complete).toHaveBeenCalledTimes(1);
    expect(limiter.reserve).toHaveBeenCalledTimes(1);
  });
});

describe('ponto de entrada', () => {
  it('configuração inválida devolve 503 em goianês, com CORS, sem chamar provedor', async () => {
    const run = vi.fn();
    const env = makeEnv({ RATE_LIMIT_PER_DAY: 'vinte', AI: { run } });
    const response = await index.fetch(jsonRequest('{"text":"oi"}'), env);
    expect(response.status).toBe(503);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ALLOWED_ORIGIN);
    expect((await response.json<{ error: string }>()).error).toMatch(GOIANO_MARKER);
    expect(run).not.toHaveBeenCalled();
  });
});
