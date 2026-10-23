import { describe, expect, it } from 'vitest';
import { renderSummary, runContractCheck } from '../scripts/contract-check';
import type { ContractResult } from '../scripts/contract-check.types';
import type { FetchPort } from '../src/providers/provider.types';

const API_KEY = 'chave-secreta-de-teste';
const MODEL = 'modelo-ativo';
const BASE_URL = 'https://engoianador.exemplo.dev';
const GROQ_HOST = 'api.groq.com';

interface FakeRoutes {
  readonly models?: readonly { readonly id: string }[];
  readonly completion?: unknown;
  readonly health?: unknown;
  readonly engoiana?: unknown;
  readonly redirectTo?: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function fakeFetch(routes: FakeRoutes, seen: string[] = []): FetchPort {
  return (url) => {
    seen.push(url);
    const { hostname, pathname } = new URL(url);
    if (routes.redirectTo !== undefined && hostname !== GROQ_HOST) {
      return Promise.resolve(new Response(null, { status: 302, headers: { Location: routes.redirectTo } }));
    }
    if (hostname === GROQ_HOST && pathname.endsWith('/models')) return Promise.resolve(json({ data: routes.models ?? [{ id: MODEL }] }));
    if (hostname === GROQ_HOST) return Promise.resolve(json(routes.completion ?? { choices: [{ message: { content: 'oi' } }] }));
    if (pathname === '/health') return Promise.resolve(json(routes.health ?? { ok: true, model: MODEL, bindings: {} }));
    return Promise.resolve(json(routes.engoiana ?? { text: 'Uai, isso é um teste.' }));
  };
}

const options = (routes: FakeRoutes, overrides: Partial<Parameters<typeof runContractCheck>[0]> = {}) => ({
  baseUrl: BASE_URL,
  apiKey: API_KEY,
  model: MODEL,
  fetchFn: fakeFetch(routes),
  ...overrides,
});

describe('runContractCheck', () => {
  it('passa quando modelo e API respondem', async () => {
    expect(await runContractCheck(options({}))).toEqual({ status: 'passed', pending: [] });
  });

  it('falha quando o modelo sumiu da lista', async () => {
    const result = await runContractCheck(options({ models: [{ id: 'outro' }] }));
    expect(result.status).toBe('failed');
    expect(result.status === 'failed' && result.problems.join(' ')).toContain(MODEL);
  });

  it('falha quando a completação mínima volta vazia', async () => {
    const result = await runContractCheck(options({ completion: { choices: [] } }));
    expect(result.status).toBe('failed');
  });

  it('falha quando a API devolve o campo errado', async () => {
    const result = await runContractCheck(options({ engoiana: { result: 'oi' } }));
    expect(result.status).toBe('failed');
  });

  it('falha quando o health não está ok', async () => {
    const result = await runContractCheck(options({ health: { ok: false, model: MODEL, bindings: {} } }));
    expect(result.status).toBe('failed');
  });

  it('pula sem chave e sem URL, sem chamar a rede', async () => {
    const seen: string[] = [];
    const result = await runContractCheck(options({}, { apiKey: undefined, baseUrl: null, fetchFn: fakeFetch({}, seen) }));
    expect(result.status).toBe('skipped');
    expect(result.status === 'skipped' && result.reason).toMatch(/sô|uai|ô rapaz/i);
    expect(seen).toEqual([]);
  });

  it('confere só a API quando não há chave', async () => {
    const seen: string[] = [];
    const result = await runContractCheck(options({}, { apiKey: undefined, fetchFn: fakeFetch({}, seen) }));
    expect(result).toEqual({ status: 'passed', pending: [expect.stringContaining('Groq: pendente do dono')] });
    expect(seen.every((url) => new URL(url).hostname !== GROQ_HOST)).toBe(true);
  });

  it('confere só a Groq quando não há URL e marca a API como pendente', async () => {
    const result = await runContractCheck(options({}, { baseUrl: null }));
    expect(result).toEqual({ status: 'passed', pending: [expect.stringContaining('API: pendente do dono')] });
    expect(renderSummary(result)).toContain('API: pendente do dono');
  });

  it('recusa URL sem https', async () => {
    const result = await runContractCheck(options({}, { baseUrl: 'http://engoianador.exemplo.dev' }));
    expect(result.status).toBe('failed');
  });

  it('recusa redirecionamento para outro host', async () => {
    const result = await runContractCheck(options({ redirectTo: 'https://outro.exemplo.dev/health' }, { apiKey: undefined }));
    expect(result.status).toBe('failed');
  });

  it('falha de rede vira problema, não exceção', async () => {
    const down: FetchPort = () => Promise.reject(new TypeError('fetch failed'));
    const result = await runContractCheck(options({}, { fetchFn: down }));
    expect(result.status).toBe('failed');
  });

  it('a saída nunca contém a chave', async () => {
    const leaky: FetchPort = (url) =>
      Promise.resolve(new Response(`erro ${API_KEY}`, { status: new URL(url).hostname === GROQ_HOST ? 401 : 500 }));
    const result = await runContractCheck(options({}, { fetchFn: leaky }));
    const summaries: readonly ContractResult[] = [result];
    expect(JSON.stringify(summaries)).not.toContain(API_KEY);
    expect(renderSummary(result)).not.toContain(API_KEY);
  });
});

describe('renderSummary', () => {
  it('não marca pendência quando as duas metades passaram', () => {
    expect(renderSummary({ status: 'passed', pending: [] })).not.toContain('pendente do dono');
  });

  it('mostra pendente do dono quando pulou', () => {
    expect(renderSummary({ status: 'skipped', reason: 'Sem config, sô.' })).toContain('pendente do dono');
  });

  it('lista os problemas quando falhou', () => {
    expect(renderSummary({ status: 'failed', problems: ['deu ruim A', 'deu ruim B'] })).toMatch(/deu ruim A[\s\S]*deu ruim B/);
  });
});
