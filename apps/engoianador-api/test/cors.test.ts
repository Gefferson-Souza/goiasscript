import { describe, it, expect } from 'vitest';
import { corsHeaders } from '../src/cors';
import { makeEnv } from './helpers';

const ALLOWED = 'https://playground.goiasscript.com.br';

function reqWithOrigin(origin?: string): Request {
  const headers = new Headers();
  if (origin) headers.set('Origin', origin);
  return new Request('https://api.exemplo/engoiana', { headers });
}

describe('corsHeaders — fail-closed', () => {
  it('emite ACAO só para origem na allowlist', () => {
    const h = corsHeaders(reqWithOrigin(ALLOWED), makeEnv({ ALLOWED_ORIGINS: ALLOWED }));
    expect(h['Access-Control-Allow-Origin']).toBe(ALLOWED);
  });

  it('NÃO emite ACAO para origem fora da allowlist', () => {
    const h = corsHeaders(reqWithOrigin('https://evil.com'), makeEnv({ ALLOWED_ORIGINS: ALLOWED }));
    expect(h['Access-Control-Allow-Origin']).toBeUndefined();
  });

  it('nunca usa wildcard quando ALLOWED_ORIGINS está vazio', () => {
    const h = corsHeaders(reqWithOrigin('https://qualquer.com'), makeEnv({ ALLOWED_ORIGINS: '' }));
    expect(h['Access-Control-Allow-Origin']).toBeUndefined();
    expect(Object.values(h)).not.toContain('*');
  });

  it('sem header Origin também não emite ACAO', () => {
    const h = corsHeaders(reqWithOrigin(), makeEnv({ ALLOWED_ORIGINS: ALLOWED }));
    expect(h['Access-Control-Allow-Origin']).toBeUndefined();
  });

  it('mantém os headers base de CORS', () => {
    const h = corsHeaders(reqWithOrigin(ALLOWED), makeEnv({ ALLOWED_ORIGINS: ALLOWED }));
    expect(h['Access-Control-Allow-Methods']).toContain('POST');
    expect(h['Vary']).toBe('Origin');
  });
});
