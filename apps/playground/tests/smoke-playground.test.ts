import { describe, expect, it } from 'vitest';
import { SANDBOX_CSP } from '../config/security-headers.constants.ts';
import { runSmoke } from '../scripts/smoke-playground.ts';

const BASE = 'https://playground.exemplo.dev';
const PAGE_CSP = "default-src 'self'; frame-ancestors 'none'";
const NOT_FOUND_BODY = '<h1>Cabôu o caminho, sô</h1><p>Essa página num existe por aqui.</p>';

type RouteHandler = (url: URL) => Response;

function healthy(url: URL): Response {
  switch (url.pathname) {
    case '/':
      return new Response('<html></html>', { status: 200, headers: { 'content-security-policy': PAGE_CSP } });
    case '/sandbox/runner.js':
      return new Response('self.onmessage=()=>{}', {
        status: 200,
        headers: { 'content-type': 'text/javascript; charset=utf-8', 'content-security-policy': SANDBOX_CSP },
      });
    case '/doacao':
      return new Response('<html></html>', { status: 200 });
    default:
      return new Response(NOT_FOUND_BODY, { status: 404 });
  }
}

const fakeFetch = (handler: RouteHandler): typeof fetch =>
  ((input: string | URL) => Promise.resolve(handler(new URL(input)))) as typeof fetch;

const withOverride = (path: string, replacement: () => Response): RouteHandler => (url) =>
  url.pathname === path ? replacement() : healthy(url);

const describeFailures = async (handler: RouteHandler) =>
  (await runSmoke(BASE, fakeFetch(handler))).map((failure) => `${failure.path} ${failure.message}`);

describe('runSmoke', () => {
  it('devolve lista vazia quando tudo responde como esperado', async () => {
    expect(await runSmoke(BASE, fakeFetch(healthy))).toEqual([]);
  });

  it('falha nomeando o cabeçalho quando o runner vem sem a CSP isolada', async () => {
    const failures = await runSmoke(
      BASE,
      fakeFetch(
        withOverride('/sandbox/runner.js', () => new Response('x', { status: 200, headers: { 'content-type': 'text/javascript' } })),
      ),
    );
    expect(failures).toHaveLength(1);
    expect(failures[0]?.path).toBe('/sandbox/runner.js');
    expect(failures[0]?.message).toContain('Content-Security-Policy');
  });

  it('falha quando a CSP do runner não é exatamente a isolada', async () => {
    const loose = SANDBOX_CSP.replace("connect-src 'none'", "connect-src *");
    const failures = await describeFailures(
      withOverride('/sandbox/runner.js', () =>
        new Response('x', { status: 200, headers: { 'content-type': 'text/javascript', 'content-security-policy': loose } }),
      ),
    );
    expect(failures.join('\n')).toContain('Content-Security-Policy');
  });

  it('falha quando o runner não é servido como JavaScript', async () => {
    const failures = await describeFailures(
      withOverride('/sandbox/runner.js', () =>
        new Response('<html></html>', { status: 200, headers: { 'content-type': 'text/html', 'content-security-policy': SANDBOX_CSP } }),
      ),
    );
    expect(failures.join('\n')).toContain('content-type');
  });

  it("falha quando a home não traz frame-ancestors 'none'", async () => {
    const failures = await describeFailures(withOverride('/', () => new Response('ok', { status: 200 })));
    expect(failures.join('\n')).toContain('frame-ancestors');
  });

  it('falha quando uma rota inexistente devolve 200', async () => {
    const failures = await describeFailures((url) =>
      url.pathname === '/rota-que-nao-existe' ? new Response(NOT_FOUND_BODY, { status: 200 }) : healthy(url),
    );
    expect(failures.join('\n')).toContain('/rota-que-nao-existe');
    expect(failures.join('\n')).toContain('404');
  });

  it('falha quando o 404 não traz o texto em goianês', async () => {
    const failures = await describeFailures((url) =>
      url.pathname === '/rota-que-nao-existe' ? new Response('Not Found', { status: 404 }) : healthy(url),
    );
    expect(failures.join('\n')).toContain('goianês');
  });

  it('falha quando /doacao não responde 200', async () => {
    const failures = await describeFailures(withOverride('/doacao', () => new Response('erro', { status: 500 })));
    expect(failures.join('\n')).toContain('/doacao');
  });

  it('trata redirecionamento para outro host como falha', async () => {
    const failures = await describeFailures(
      withOverride('/doacao', () => new Response(null, { status: 302, headers: { location: 'https://outro.exemplo.net/doacao' } })),
    );
    expect(failures.join('\n')).toContain('outro host');
  });

  it('segue redirecionamento dentro do mesmo host', async () => {
    const handler: RouteHandler = (url) =>
      url.pathname === '/doacao'
        ? new Response(null, { status: 308, headers: { location: `${BASE}/doacao/` } })
        : url.pathname === '/doacao/'
          ? new Response('ok', { status: 200 })
          : healthy(url);
    expect(await runSmoke(BASE, fakeFetch(handler))).toEqual([]);
  });

  it('registra falha de rede em vez de lançar', async () => {
    const failing = (() => Promise.reject(new Error('ECONNREFUSED'))) as typeof fetch;
    const failures = await runSmoke(BASE, failing);
    expect(failures).toHaveLength(4);
    expect(failures[0]?.message).toContain('ECONNREFUSED');
  });
});
