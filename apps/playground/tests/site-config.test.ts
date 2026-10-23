import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PUBLIC_ENV_PLACEHOLDERS } from '../config/site-config.constants.ts';
import { ConfigError, readSiteConfig } from '../config/site-config.ts';

const PIX = 'NEXT_PUBLIC_DONATION_PIX_KEY';
const SPONSORS = 'NEXT_PUBLIC_DONATION_SPONSORS_URL';

describe('readSiteConfig', () => {
  it('em desenvolvimento, variável ausente vira null', () => {
    expect(readSiteConfig({}, 'development')).toEqual({
      siteUrl: null,
      engoianadorUrl: null,
      donation: { pixKey: null, sponsorsUrl: null, kofiUrl: null },
      contactUrl: null,
    });
  });

  it('em produção, variável ausente também desliga o recurso', () => {
    expect(readSiteConfig({}, 'production').donation.pixKey).toBeNull();
  });

  it('em produção, a chave Pix igual ao .env.example derruba o build e nomeia a variável', () => {
    const run = (): unknown => readSiteConfig({ [PIX]: PUBLIC_ENV_PLACEHOLDERS[PIX] }, 'production');
    expect(run).toThrow(ConfigError);
    expect(run).toThrow(PIX);
  });

  it.each([
    'https://site.invalid/',
    'HTTPS://SITE.INVALID',
    'https://outro-host.invalid/caminho',
    'https://Sub.Exemplo.INVALID',
  ])('em produção, a URL de exemplo %s derruba o build', (value) => {
    expect(() => readSiteConfig({ [SPONSORS]: value }, 'production')).toThrow(SPONSORS);
  });

  it.each(['COLE_A_CHAVE_PIX_AQUI', 'cole_a_chave', 'SEU_PIX_AQUI', 'seu_pix'])(
    'em produção, a chave Pix de exemplo %s derruba o build',
    (value) => {
      expect(() => readSiteConfig({ [PIX]: value }, 'production')).toThrow(PIX);
    },
  );

  it('em desenvolvimento, o valor de exemplo passa', () => {
    expect(readSiteConfig({ [PIX]: PUBLIC_ENV_PLACEHOLDERS[PIX] }, 'development').donation.pixKey).toBe(
      PUBLIC_ENV_PLACEHOLDERS[PIX],
    );
  });

  it.each(['javascript:alert(1)', 'data:text/html,x', 'http://exemplo.test', 'isso não é url'])(
    'em produção, recusa a URL %s',
    (value) => {
      expect(() => readSiteConfig({ [SPONSORS]: value }, 'production')).toThrow(SPONSORS);
    },
  );

  it('em desenvolvimento, aceita http mas recusa esquema perigoso', () => {
    expect(readSiteConfig({ [SPONSORS]: 'http://localhost:3000/' }, 'development').donation.sponsorsUrl).toBe(
      'http://localhost:3000/',
    );
    expect(readSiteConfig({ [SPONSORS]: 'javascript:alert(1)' }, 'development').donation.sponsorsUrl).toBeNull();
  });

  it('normaliza a URL válida e descarta credencial embutida', () => {
    const config = readSiteConfig({ [SPONSORS]: '  https://github.com//sponsors/alguem  ' }, 'production');
    expect(config.donation.sponsorsUrl).toBe('https://github.com/sponsors/alguem');
  });

  it('recusa credencial user:pass@ na URL', () => {
    expect(() => readSiteConfig({ [SPONSORS]: 'https://user:pass@github.com/x' }, 'production')).toThrow(SPONSORS);
  });

  it('recusa chave Pix com espaço ou longa demais', () => {
    expect(() => readSiteConfig({ [PIX]: 'tem espaço' }, 'production')).toThrow(PIX);
    expect(() => readSiteConfig({ [PIX]: 'a'.repeat(200) }, 'production')).toThrow(PIX);
  });

  it('trata valor vazio como ausente', () => {
    expect(readSiteConfig({ [PIX]: '   ' }, 'production').donation.pixKey).toBeNull();
  });

  it('lê todas as variáveis públicas', () => {
    const config = readSiteConfig(
      {
        NEXT_PUBLIC_SITE_URL: 'https://exemplo.com.br',
        NEXT_PUBLIC_ENGOIANADOR_URL: 'https://api.exemplo.com.br',
        [PIX]: 'chave-real@exemplo.com.br',
        NEXT_PUBLIC_DONATION_KOFI_URL: 'https://ko-fi.com/alguem',
        NEXT_PUBLIC_CONTACT_URL: 'https://exemplo.com.br/contato',
      },
      'production',
    );
    expect(config.siteUrl).toBe('https://exemplo.com.br/');
    expect(config.engoianadorUrl).toBe('https://api.exemplo.com.br/');
    expect(config.donation.pixKey).toBe('chave-real@exemplo.com.br');
    expect(config.donation.kofiUrl).toBe('https://ko-fi.com/alguem');
    expect(config.contactUrl).toBe('https://exemplo.com.br/contato');
  });
});

describe('.env.example', () => {
  const lines = readFileSync(new URL('../.env.example', import.meta.url), 'utf8')
    .split('\n')
    .filter((line) => line.trim() !== '' && !line.startsWith('#'));
  const entries = lines.map((line) => {
    const index = line.indexOf('=');
    return [line.slice(0, index), line.slice(index + 1)] as const;
  });

  it('só traz placeholders reconhecíveis', () => {
    expect(entries.length).toBeGreaterThan(0);
    for (const [name, value] of entries) {
      expect(value.endsWith('.invalid') || value.startsWith('COLE_') || value.startsWith('SEU_'), name).toBe(true);
    }
  });

  it('é idêntico à tabela de placeholders que o build compara', () => {
    expect(Object.fromEntries(entries)).toEqual(PUBLIC_ENV_PLACEHOLDERS);
  });
});
