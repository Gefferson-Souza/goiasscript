import { describe, expect, it } from 'vitest';
import { parseEngoianarRequest } from '../src/validation';
import { jsonRequest, makeConfig } from './helpers';

const config = makeConfig({ maxBodyBytes: 200, maxInputChars: 20 });
const GOIANO_MARKER = /sô|ô|uai|trem/iu;

function streamedRequest(chunks: readonly string[], headers: Readonly<Record<string, string>>): { readonly request: Request; readonly wasRead: () => boolean } {
  let pulled = false;
  const encoder = new TextEncoder();
  const queue = [...chunks];
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      pulled = true;
      const next = queue.shift();
      if (next === undefined) controller.close();
      else controller.enqueue(encoder.encode(next));
    },
  }, { highWaterMark: 0 });
  const init = { method: 'POST', headers, body: stream, duplex: 'half' } as RequestInit;
  return { request: new Request('https://api.exemplo/engoiana', init), wasRead: () => pulled };
}

describe('parseEngoianarRequest', () => {
  it('aceita corpo válido e devolve o texto aparado', async () => {
    const result = await parseEngoianarRequest(jsonRequest('{"text":"  oi, tudo bem  "}'), config);
    expect(result).toEqual({ ok: true, text: 'oi, tudo bem' });
  });

  it('aceita Content-Type com charset', async () => {
    const result = await parseEngoianarRequest(jsonRequest('{"text":"oi"}', { contentType: 'application/json; charset=utf-8' }), config);
    expect(result.ok).toBe(true);
  });

  it.each([['text/plain'], ['application/x-www-form-urlencoded'], [null]])('recusa Content-Type %s com 415', async (contentType) => {
    const result = await parseEngoianarRequest(jsonRequest('{"text":"oi"}', { contentType }), config);
    expect(result).toMatchObject({ ok: false, status: 415 });
  });

  it('recusa Content-Length ausente com 411', async () => {
    const result = await parseEngoianarRequest(jsonRequest('{"text":"oi"}', { contentLength: null }), config);
    expect(result).toMatchObject({ ok: false, status: 411 });
  });

  it.each([['abc'], ['-1'], ['1.5'], ['']])('recusa Content-Length inválido (%s) com 400', async (contentLength) => {
    const result = await parseEngoianarRequest(jsonRequest('{"text":"oi"}', { contentLength }), config);
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it('recusa Content-Length acima do teto sem ler o corpo', async () => {
    const { request, wasRead } = streamedRequest(['{"text":"oi"}'], { 'Content-Type': 'application/json', 'Content-Length': '201' });
    const result = await parseEngoianarRequest(request, config);
    expect(result).toMatchObject({ ok: false, status: 413 });
    expect(wasRead()).toBe(false);
  });

  it('recusa corpo maior que o declarado com 413', async () => {
    const result = await parseEngoianarRequest(jsonRequest('{"text":"oi"}', { contentLength: '5' }), config);
    expect(result).toMatchObject({ ok: false, status: 413 });
  });

  it('interrompe a leitura quando os bytes passam do teto, mesmo com declaração mentirosa', async () => {
    const chunk = 'x'.repeat(150);
    const { request } = streamedRequest([chunk, chunk, chunk], { 'Content-Type': 'application/json', 'Content-Length': '100' });
    const result = await parseEngoianarRequest(request, { ...config, maxBodyBytes: 200 });
    expect(result).toMatchObject({ ok: false, status: 413 });
  });

  it.each([['null'], ['[]'], ['["oi"]'], ['"oi"'], ['42'], ['{}'], ['{"text":42}'], ['{"text":null}'], ['{"text":""}'], ['{"text":"   "}'], ['{"text":"oi","extra":1}'], ['{"texto":"oi"}'], ['não é json']])(
    'recusa corpo %s com 400',
    async (body) => {
      const result = await parseEngoianarRequest(jsonRequest(body), config);
      expect(result).toMatchObject({ ok: false, status: 400 });
    },
  );

  it('recusa texto acima de MAX_INPUT_CHARS com 413', async () => {
    const result = await parseEngoianarRequest(jsonRequest(JSON.stringify({ text: 'a'.repeat(21) })), config);
    expect(result).toMatchObject({ ok: false, status: 413 });
  });

  it('aceita texto exatamente no limite de caracteres', async () => {
    const result = await parseEngoianarRequest(jsonRequest(JSON.stringify({ text: 'a'.repeat(20) })), config);
    expect(result.ok).toBe(true);
  });

  it('recusa requisição sem corpo com 400', async () => {
    const request = new Request('https://api.exemplo/engoiana', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': '0' } });
    expect(await parseEngoianarRequest(request, config)).toMatchObject({ ok: false, status: 400 });
  });

  it('escreve toda mensagem de recusa em goianês', async () => {
    const rejected = await Promise.all([
      parseEngoianarRequest(jsonRequest('{}', { contentType: 'text/plain' }), config),
      parseEngoianarRequest(jsonRequest('{}', { contentLength: null }), config),
      parseEngoianarRequest(jsonRequest('{}', { contentLength: '999' }), config),
      parseEngoianarRequest(jsonRequest('null'), config),
      parseEngoianarRequest(jsonRequest(JSON.stringify({ text: 'a'.repeat(21) })), config),
    ]);
    for (const result of rejected) {
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toMatch(GOIANO_MARKER);
    }
  });
});
