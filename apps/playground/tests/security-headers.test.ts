import { describe, expect, it } from 'vitest';
import { buildSecurityHeaders } from '../config/security-headers.ts';
import type { SiteConfig } from '../config/site-config.types.ts';

const EMPTY: SiteConfig = {
  siteUrl: null,
  engoianadorUrl: null,
  donation: { pixKey: null, sponsorsUrl: null, kofiUrl: null },
  contactUrl: null,
};

const valueOf = (headers: readonly { readonly key: string; readonly value: string }[], key: string): string | undefined =>
  headers.find((header) => header.key === key)?.value;

const rules = (config: SiteConfig) => buildSecurityHeaders(config);
const pageRule = (config: SiteConfig) => rules(config).find((rule) => rule.source === '/:path*');
const sandboxRule = (config: SiteConfig) => rules(config).find((rule) => rule.source === '/sandbox/:path*');

describe('cabeçalhos da página principal', () => {
  const csp = valueOf(pageRule(EMPTY)?.headers ?? [], 'Content-Security-Policy') ?? '';

  it.each(["frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'", "connect-src 'self'", "worker-src 'self'"])(
    'inclui %s',
    (directive) => {
      expect(csp.split('; ')).toContain(directive);
    },
  );

  it("não libera 'unsafe-eval'", () => {
    expect(csp).not.toContain('unsafe-eval');
  });

  it('só libera o Engoianador em connect-src quando configurado', () => {
    const configured = { ...EMPTY, engoianadorUrl: 'https://api.exemplo.com.br/' };
    const cspConfigured = valueOf(pageRule(configured)?.headers ?? [], 'Content-Security-Policy') ?? '';
    expect(cspConfigured).toContain("connect-src 'self' https://api.exemplo.com.br");
    expect(csp).not.toContain('api.exemplo');
  });

  it('traz os cabeçalhos de endurecimento', () => {
    const headers = pageRule(EMPTY)?.headers ?? [];
    expect(valueOf(headers, 'X-Content-Type-Options')).toBe('nosniff');
    expect(valueOf(headers, 'X-Frame-Options')).toBe('DENY');
    expect(valueOf(headers, 'Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });
});

describe('cabeçalhos do runner', () => {
  const headers = sandboxRule(EMPTY)?.headers ?? [];

  it('usa exatamente a política provada no spike', () => {
    expect(valueOf(headers, 'Content-Security-Policy')).toBe(
      "default-src 'none'; script-src 'self' blob:; worker-src blob:; connect-src 'none'; img-src 'none'",
    );
  });

  it('impede sniffing e uso cruzado do recurso', () => {
    expect(valueOf(headers, 'X-Content-Type-Options')).toBe('nosniff');
    expect(valueOf(headers, 'Cross-Origin-Resource-Policy')).toBe('same-origin');
  });

  it('vem depois da regra geral para a CSP do runner prevalecer', () => {
    expect(rules(EMPTY).map((rule) => rule.source)).toEqual(['/:path*', '/sandbox/:path*']);
  });
});

describe('cabeçalhos em desenvolvimento', () => {
  it("só o dev libera 'unsafe-eval' na página, nunca no runner", () => {
    const dev = buildSecurityHeaders(EMPTY, 'development');
    const pageCsp = valueOf(dev[0]?.headers ?? [], 'Content-Security-Policy') ?? '';
    expect(pageCsp).toContain("'unsafe-eval'");
    expect(valueOf(dev[1]?.headers ?? [], 'Content-Security-Policy')).not.toContain('unsafe-eval');
  });
});
