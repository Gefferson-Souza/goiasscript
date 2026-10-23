import { afterEach, describe, expect, it, vi } from 'vitest';
import index from '../src/index';
import { createFakeNamespace } from './fake-quota';
import { ALLOWED_ORIGIN, jsonRequest, makeEnv } from './helpers';

const NETWORK_HEADER = 'cf-connecting-ip';
const GOIANO_MARKER = /sô|ô|uai|trem/iu;
const REQUEST_BODY = '{"text":"bom dia"}';

function groqAnswer(content: string): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

function requestFrom(ip: string): Request {
  const base = jsonRequest(REQUEST_BODY);
  const headers = new Headers(base.headers);
  headers.set(NETWORK_HEADER, ip);
  return new Request(base.url, { method: 'POST', headers, body: REQUEST_BODY });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fluxo completo do Worker', () => {
  it('POST válido percorre validação, cota, provedor e cache', async () => {
    const ledger = createFakeNamespace();
    const fetchMock = vi.fn(() => Promise.resolve(groqAnswer('"Bão demais, sô"')));
    vi.stubGlobal('fetch', fetchMock);
    const env = makeEnv({ GROQ_API_KEY: 'chave-de-teste', QUOTA_LEDGER: ledger.namespace });

    const response = await index.fetch(requestFrom('203.0.113.7'), env);

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ALLOWED_ORIGIN);
    expect(await response.json()).toEqual({ text: 'Bão demais, sô' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(ledger.objectNames().length).toBe(2);
  });

  it('provedores em erro devolvem 502 em goianês e devolvem a cota', async () => {
    const ledger = createFakeNamespace();
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('{"segredo":"corpo cru"}', { status: 500 }))));
    const run = vi.fn(() => Promise.reject(new Error('IA fora do ar')));
    const env = makeEnv({ GROQ_API_KEY: 'chave-de-teste', AI: { run }, QUOTA_LEDGER: ledger.namespace, RATE_LIMIT_PER_DAY: '1' });

    const first = await index.fetch(requestFrom('203.0.113.8'), env);
    const second = await index.fetch(requestFrom('203.0.113.8'), env);

    expect(first.status).toBe(502);
    expect((await first.json<{ error: string }>()).error).toMatch(GOIANO_MARKER);
    expect(second.status).toBe(502);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('cota negada devolve 429 com Retry-After', async () => {
    const ledger = createFakeNamespace();
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(groqAnswer('uai'))));
    const env = makeEnv({ GROQ_API_KEY: 'chave-de-teste', QUOTA_LEDGER: ledger.namespace, RATE_LIMIT_PER_DAY: '1' });

    const allowed = await index.fetch(requestFrom('203.0.113.9'), env);
    const denied = await index.fetch(requestFrom('203.0.113.9'), env);

    expect(allowed.status).toBe(200);
    expect(denied.status).toBe(429);
    expect(Number(denied.headers.get('Retry-After'))).toBeGreaterThan(0);
    expect((await denied.json<{ error: string }>()).error).toMatch(GOIANO_MARKER);
  });

  it('rota desconhecida devolve 404', async () => {
    const env = makeEnv({ QUOTA_LEDGER: createFakeNamespace().namespace });
    const response = await index.fetch(jsonRequest('', { method: 'GET', path: '/nada' }), env);
    expect(response.status).toBe(404);
  });

  it('cota fora do ar vira 503 de recesso sem chamar provedor', async () => {
    const ledger = createFakeNamespace({ failWith: new Error('DO indisponível') });
    const fetchMock = vi.fn(() => Promise.resolve(groqAnswer('uai')));
    vi.stubGlobal('fetch', fetchMock);
    const env = makeEnv({ GROQ_API_KEY: 'chave-de-teste', QUOTA_LEDGER: ledger.namespace });

    const response = await index.fetch(requestFrom('203.0.113.10'), env);

    expect(response.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reaproveita o manipulador e a configuração para o mesmo env', async () => {
    const ledger = createFakeNamespace();
    const env = makeEnv({ QUOTA_LEDGER: ledger.namespace });
    const health = jsonRequest('', { method: 'GET', path: '/health' });

    const first = await index.fetch(health, env);
    const second = await index.fetch(jsonRequest('', { method: 'GET', path: '/health' }), env);

    expect(second.status).toBe(first.status);
  });
});
