import { describe, expect, it, vi } from 'vitest';
import { checkEngoianadorHealth, engoianar } from '../lib/engoianador-client.ts';
import { HEALTH_TIMEOUT_MS, MAX_INPUT_CHARS, REQUEST_TEXT_FIELD, REQUEST_TIMEOUT_MS, RESPONSE_TEXT_FIELDS } from '../lib/engoianador-client.constants.ts';
import type { FetchPort, FetchResponseLike } from '../lib/engoianador-client.types.ts';

const BASE_URL = 'https://engoianador.example.org';

function respond(status: number, body: unknown): FetchResponseLike {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: () => (body instanceof Error ? Promise.reject(body) : Promise.resolve(body)),
  };
}

function fakeFetch(response: FetchResponseLike | Error): ReturnType<typeof vi.fn<FetchPort>> {
  return vi.fn<FetchPort>(() => (response instanceof Error ? Promise.reject(response) : Promise.resolve(response)));
}

describe('engoianar', () => {
  it('sem URL configurada devolve disabled e não chama fetch', async () => {
    const fetchFn = fakeFetch(respond(200, {}));
    const result = await engoianar('oi', { baseUrl: null, fetchFn });
    expect(result).toEqual({ ok: false, reason: 'disabled' });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('200 com o texto engoianado vira ok', async () => {
    const fetchFn = fakeFetch(respond(200, { text: 'uai, sô' }));
    expect(await engoianar('oi', { baseUrl: BASE_URL, fetchFn })).toEqual({ ok: true, text: 'uai, sô' });
  });

  it('fala o contrato { text } na ida e na volta', async () => {
    expect(REQUEST_TEXT_FIELD).toBe('text');
    expect(RESPONSE_TEXT_FIELDS).toEqual(['text']);
    const fetchFn = fakeFetch(respond(200, { [RESPONSE_TEXT_FIELDS[0]]: 'uai, sô' }));
    expect(await engoianar('oi', { baseUrl: BASE_URL, fetchFn })).toEqual({ ok: true, text: 'uai, sô' });
  });

  it('não aceita mais o campo engoianado na resposta', async () => {
    const fetchFn = fakeFetch(respond(200, { engoianado: 'uai, sô' }));
    expect(await engoianar('oi', { baseUrl: BASE_URL, fetchFn })).toEqual({ ok: false, reason: 'unavailable' });
  });

  it.each([
    [429, 'rate-limited'],
    [400, 'invalid'],
    [413, 'invalid'],
    [500, 'unavailable'],
    [502, 'unavailable'],
    [503, 'unavailable'],
    [404, 'unavailable'],
  ] as const)('status %i vira %s', async (status, reason) => {
    const fetchFn = fakeFetch(respond(status, { error: 'x' }));
    expect(await engoianar('oi', { baseUrl: BASE_URL, fetchFn })).toEqual({ ok: false, reason });
  });

  it('rede caída vira unavailable', async () => {
    const fetchFn = fakeFetch(new TypeError('Failed to fetch'));
    expect(await engoianar('oi', { baseUrl: BASE_URL, fetchFn })).toEqual({ ok: false, reason: 'unavailable' });
  });

  it('JSON malformado vira unavailable', async () => {
    const fetchFn = fakeFetch(respond(200, new SyntaxError('Unexpected token')));
    expect(await engoianar('oi', { baseUrl: BASE_URL, fetchFn })).toEqual({ ok: false, reason: 'unavailable' });
  });

  it.each([[{}], [{ text: 42 }], [{ text: '' }], [null], ['texto solto']])(
    '200 com corpo fora do contrato (%j) vira unavailable',
    async (body) => {
      const fetchFn = fakeFetch(respond(200, body));
      expect(await engoianar('oi', { baseUrl: BASE_URL, fetchFn })).toEqual({ ok: false, reason: 'unavailable' });
    },
  );

  it('envia POST JSON com credentials omit, sinal com teto e sem redirecionar', async () => {
    const fetchFn = fakeFetch(respond(200, { text: 'ok' }));
    const signal = new AbortController().signal;
    const createTimeoutSignal = vi.fn(() => signal);
    await engoianar('Olá, mundo', { baseUrl: `${BASE_URL}/`, fetchFn, createTimeoutSignal });
    expect(createTimeoutSignal).toHaveBeenCalledWith(REQUEST_TIMEOUT_MS);
    expect(REQUEST_TIMEOUT_MS).toBe(15_000);
    const [url, init] = fetchFn.mock.calls[0] ?? [];
    expect(url).toBe(`${BASE_URL}/engoiana`);
    expect(init?.method).toBe('POST');
    expect(init?.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(init?.body ?? '')).toEqual({ [REQUEST_TEXT_FIELD]: 'Olá, mundo' });
    expect(init?.credentials).toBe('omit');
    expect(init?.redirect).toBe('error');
    expect(init?.signal).toBe(signal);
  });

  it('recusa texto acima do limite antes de enviar', async () => {
    const fetchFn = fakeFetch(respond(200, { text: 'ok' }));
    const result = await engoianar('a'.repeat(MAX_INPUT_CHARS + 1), { baseUrl: BASE_URL, fetchFn });
    expect(result).toEqual({ ok: false, reason: 'invalid' });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('aceita texto exatamente no limite', async () => {
    const fetchFn = fakeFetch(respond(200, { text: 'ok' }));
    const result = await engoianar('a'.repeat(MAX_INPUT_CHARS), { baseUrl: BASE_URL, fetchFn });
    expect(result.ok).toBe(true);
  });

  it('recusa texto vazio ou só espaço sem enviar', async () => {
    const fetchFn = fakeFetch(respond(200, { text: 'ok' }));
    expect(await engoianar('   ', { baseUrl: BASE_URL, fetchFn })).toEqual({ ok: false, reason: 'invalid' });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('devolve o texto cru, sem interpretar como HTML', async () => {
    const hostile = '<img src=x onerror=alert(1)>';
    const fetchFn = fakeFetch(respond(200, { text: hostile }));
    expect(await engoianar('oi', { baseUrl: BASE_URL, fetchFn })).toEqual({ ok: true, text: hostile });
  });
});

describe('checkEngoianadorHealth', () => {
  it('disabled quando não há URL e não faz requisição', async () => {
    const fetchFn = fakeFetch(respond(200, { ok: true }));
    expect(await checkEngoianadorHealth({ baseUrl: null, fetchFn })).toBe('disabled');
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('up para 200 com ok true', async () => {
    const fetchFn = fakeFetch(respond(200, { ok: true, model: 'm', bindings: {} }));
    expect(await checkEngoianadorHealth({ baseUrl: BASE_URL, fetchFn })).toBe('up');
  });

  it.each([
    ['503 com ok false', respond(503, { ok: false })],
    ['200 com ok false', respond(200, { ok: false })],
    ['200 sem o campo ok', respond(200, {})],
    ['200 com ok em texto', respond(200, { ok: 'true' })],
    ['JSON torto', respond(200, new SyntaxError('Unexpected token'))],
    ['corpo nulo', respond(200, null)],
    ['rede caída', new TypeError('Failed to fetch')],
  ])('down para %s', async (_name, response) => {
    const fetchFn = fakeFetch(response);
    expect(await checkEngoianadorHealth({ baseUrl: BASE_URL, fetchFn })).toBe('down');
  });

  it('pede GET /health sem credenciais, sem seguir redirecionamento e com teto de tempo', async () => {
    const fetchFn = fakeFetch(respond(200, { ok: true }));
    const signal = new AbortController().signal;
    const createTimeoutSignal = vi.fn(() => signal);
    await checkEngoianadorHealth({ baseUrl: `${BASE_URL}/`, fetchFn, createTimeoutSignal });
    expect(createTimeoutSignal).toHaveBeenCalledWith(HEALTH_TIMEOUT_MS);
    expect(HEALTH_TIMEOUT_MS).toBeLessThan(REQUEST_TIMEOUT_MS);
    const [url, init] = fetchFn.mock.calls[0] ?? [];
    expect(url).toBe(`${BASE_URL}/health`);
    expect(init?.method).toBe('GET');
    expect(init?.body).toBeUndefined();
    expect(init?.credentials).toBe('omit');
    expect(init?.redirect).toBe('error');
    expect(init?.signal).toBe(signal);
  });

  it('não segue redirecionamento: o erro do fetch vira down', async () => {
    const fetchFn = fakeFetch(new TypeError('redirect mode is set to error'));
    expect(await checkEngoianadorHealth({ baseUrl: BASE_URL, fetchFn })).toBe('down');
  });
});
