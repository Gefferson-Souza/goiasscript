import { describe, expect, it } from 'vitest';
import { SANDBOX_CSP } from '../config/security-headers.constants.ts';
import { runSmokeCli } from '../scripts/smoke-playground-cli.ts';

const BASE = 'https://playground.exemplo.dev';

function collectIo() {
  const out: string[] = [];
  const err: string[] = [];
  return { out, err, io: { out: (text: string) => out.push(text), err: (text: string) => err.push(text) } };
}

const unreachable = (() => Promise.reject(new Error('sem rede'))) as typeof fetch;

describe('runSmokeCli', () => {
  it('recusa chamada sem endereço', async () => {
    const { io, err } = collectIo();
    expect(await runSmokeCli([], io, unreachable)).toBe(2);
    expect(err.join('')).toContain('endereço');
  });

  it.each(['http://playground.exemplo.dev', 'ftp://x.dev', 'não-é-url'])('recusa %s', async (candidate) => {
    const { io, err } = collectIo();
    expect(await runSmokeCli([candidate], io, unreachable)).toBe(2);
    expect(err.join('')).toContain('https://');
  });

  it('sai com 1 e lista cada falha quando o smoke reprova', async () => {
    const { io, err } = collectIo();
    expect(await runSmokeCli([BASE], io, unreachable)).toBe(1);
    expect(err.join('')).toContain('/sandbox/runner.js');
    expect(err.join('')).toContain('sem rede');
  });

  it('sai com 0 e avisa quando tudo passa', async () => {
    const { io, out } = collectIo();
    const healthy = ((input: string | URL) => {
      const { pathname } = new URL(input);
      if (pathname === '/') return Promise.resolve(new Response('', { headers: { 'content-security-policy': "frame-ancestors 'none'" } }));
      if (pathname === '/sandbox/runner.js') {
        return Promise.resolve(
          new Response('', { headers: { 'content-type': 'text/javascript', 'content-security-policy': SANDBOX_CSP } }),
        );
      }
      if (pathname === '/doacao') return Promise.resolve(new Response('', { status: 200 }));
      return Promise.resolve(new Response('Cabôu o caminho, sô', { status: 404 }));
    }) as typeof fetch;
    expect(await runSmokeCli([BASE], io, healthy)).toBe(0);
    expect(out.join('')).toContain('Tá pronto, sô');
  });
});
