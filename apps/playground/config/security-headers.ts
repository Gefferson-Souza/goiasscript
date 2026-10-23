import {
  HARDENING_HEADERS,
  PAGE_CSP_DIRECTIVES,
  PAGE_SOURCE,
  SANDBOX_CSP,
  SANDBOX_EXTRA_HEADERS,
  SANDBOX_SOURCE,
} from './security-headers.constants.ts';
import type { HeaderRule } from './security-headers.types.ts';
import type { BuildMode, SiteConfig } from './site-config.types.ts';

function connectSource(config: SiteConfig): string {
  const extra = config.engoianadorUrl === null ? '' : ` ${new URL(config.engoianadorUrl).origin}`;
  return `connect-src 'self'${extra}`;
}

// O React Refresh do `next dev` usa eval; o build de produção nunca recebe essa exceção.
function scriptSource(mode: BuildMode): string {
  const base = PAGE_CSP_DIRECTIVES.find((directive) => directive.startsWith('script-src')) ?? '';
  return mode === 'development' ? `${base} 'unsafe-eval'` : base;
}

function pageCsp(config: SiteConfig, mode: BuildMode): string {
  const directives = PAGE_CSP_DIRECTIVES.map((directive) =>
    directive.startsWith('script-src') ? scriptSource(mode) : directive,
  );
  return [...directives, connectSource(config)].join('; ');
}

// A regra do runner vem depois: no Next, o último valor de uma mesma chave vence.
export function buildSecurityHeaders(config: SiteConfig, mode: BuildMode = 'production'): readonly HeaderRule[] {
  return [
    {
      source: PAGE_SOURCE,
      headers: [{ key: 'Content-Security-Policy', value: pageCsp(config, mode) }, ...HARDENING_HEADERS],
    },
    {
      source: SANDBOX_SOURCE,
      headers: [{ key: 'Content-Security-Policy', value: SANDBOX_CSP }, ...SANDBOX_EXTRA_HEADERS],
    },
  ];
}
