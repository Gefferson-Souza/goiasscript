import { describe, expect, it } from 'vitest';
import { createGroqProvider } from '../src/providers/groq';
import type { FetchPort } from '../src/providers/provider.types';

const API_KEY = 'chave-de-teste-nao-vazar';
const MODEL = 'modelo-de-teste';
const SHORT_TIMEOUT_MS = 20;
const LONG_TIMEOUT_MS = 5000;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function completion(content: string): Response {
  return jsonResponse({ choices: [{ message: { content } }] });
}

interface Recorder {
  readonly fetchFn: FetchPort;
  readonly calls: { readonly url: string; readonly init: RequestInit }[];
}

function recordingFetch(respond: () => Response): Recorder {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchFn: FetchPort = (url, init) => {
    calls.push({ url, init });
    return Promise.resolve(respond());
  };
  return { fetchFn, calls };
}

function provider(fetchFn: FetchPort, timeoutMs = LONG_TIMEOUT_MS) {
  return createGroqProvider({ apiKey: API_KEY, model: MODEL, fetchFn, timeoutMs });
}

function bodyOf(init: RequestInit | undefined): string {
  return typeof init?.body === 'string' ? init.body : '';
}

const NEVER_ABORTED = new AbortController().signal;

describe('createGroqProvider', () => {
  it('sucesso devolve o texto sem aspas', async () => {
    const { fetchFn } = recordingFetch(() => completion('"Uai, sô!"'));
    const result = await provider(fetchFn).complete('oi', NEVER_ABORTED);
    expect(result).toEqual({ ok: true, text: 'Uai, sô!', provider: 'groq' });
  });

  it('status 400 vira client-error', async () => {
    const { fetchFn } = recordingFetch(() => jsonResponse({ error: { message: 'ruim' } }, 400));
    const result = await provider(fetchFn).complete('oi', NEVER_ABORTED);
    expect(result).toEqual({ ok: false, failure: 'client-error', provider: 'groq' });
  });

  it('status 503 vira server-error', async () => {
    const { fetchFn } = recordingFetch(() => jsonResponse({}, 503));
    const result = await provider(fetchFn).complete('oi', NEVER_ABORTED);
    expect(result).toEqual({ ok: false, failure: 'server-error', provider: 'groq' });
  });

  it('rede caída vira server-error', async () => {
    const fetchFn: FetchPort = () => Promise.reject(new TypeError('fetch failed'));
    const result = await provider(fetchFn).complete('oi', NEVER_ABORTED);
    expect(result).toEqual({ ok: false, failure: 'server-error', provider: 'groq' });
  });

  it('JSON torto vira server-error', async () => {
    const { fetchFn } = recordingFetch(() => new Response('<html>', { status: 200 }));
    const result = await provider(fetchFn).complete('oi', NEVER_ABORTED);
    expect(result).toEqual({ ok: false, failure: 'server-error', provider: 'groq' });
  });

  it('timeout vira timeout', async () => {
    const hanging: FetchPort = (_url, init) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => {
          reject(init.signal?.reason instanceof Error ? init.signal.reason : new Error('aborted'));
        });
      });
    const result = await provider(hanging, SHORT_TIMEOUT_MS).complete('oi', NEVER_ABORTED);
    expect(result).toEqual({ ok: false, failure: 'timeout', provider: 'groq' });
  });

  it('modelo desligado vira model-disabled', async () => {
    const body = { error: { message: 'The model has been decommissioned', code: 'model_decommissioned' } };
    const { fetchFn } = recordingFetch(() => jsonResponse(body, 400));
    const result = await provider(fetchFn).complete('oi', NEVER_ABORTED);
    expect(result).toEqual({ ok: false, failure: 'model-disabled', provider: 'groq' });
  });

  it('resposta vazia vira empty', async () => {
    const { fetchFn } = recordingFetch(() => completion('   '));
    const result = await provider(fetchFn).complete('oi', NEVER_ABORTED);
    expect(result).toEqual({ ok: false, failure: 'empty', provider: 'groq' });
  });

  it('a chave só vai no cabeçalho Authorization', async () => {
    const { fetchFn, calls } = recordingFetch(() => completion('bão'));
    await provider(fetchFn).complete('oi', NEVER_ABORTED);
    const [call] = calls;
    expect(new Headers(call?.init.headers).get('Authorization')).toBe(`Bearer ${API_KEY}`);
    expect(call?.url).not.toContain(API_KEY);
    expect(bodyOf(call?.init)).not.toContain(API_KEY);
  });

  it('o provedor usa o modelo vindo da configuração', async () => {
    const { fetchFn, calls } = recordingFetch(() => completion('bão'));
    await provider(fetchFn).complete('oi', NEVER_ABORTED);
    const payload = JSON.parse(bodyOf(calls[0]?.init)) as { readonly model: string };
    expect(payload.model).toBe(MODEL);
  });

  it('sem chave não chama a rede e vira model-disabled', async () => {
    const { fetchFn, calls } = recordingFetch(() => completion('bão'));
    const keyless = createGroqProvider({ apiKey: undefined, model: MODEL, fetchFn, timeoutMs: LONG_TIMEOUT_MS });
    const result = await keyless.complete('oi', NEVER_ABORTED);
    expect(result).toEqual({ ok: false, failure: 'model-disabled', provider: 'groq' });
    expect(calls).toHaveLength(0);
  });

  it('respeita o cancelamento da requisição de origem', async () => {
    const controller = new AbortController();
    const hanging: FetchPort = (_url, init) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => {
          reject(init.signal?.reason instanceof Error ? init.signal.reason : new Error('aborted'));
        });
      });
    const pending = provider(hanging).complete('oi', controller.signal);
    controller.abort();
    expect(await pending).toEqual({ ok: false, failure: 'timeout', provider: 'groq' });
  });
});
