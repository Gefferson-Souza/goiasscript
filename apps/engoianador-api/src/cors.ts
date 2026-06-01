import type { Env } from './engoiana';

const BASE_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-user-api-key',
  'Access-Control-Max-Age': '86400',
  Vary: 'Origin',
};

/**
 * Resolve a origem permitida. Fail-closed: se a origem da requisição não
 * estiver explicitamente na allowlist (ALLOWED_ORIGINS), NÃO emite o header
 * Access-Control-Allow-Origin — o browser bloqueia a chamada cross-origin.
 * Nunca usa wildcard '*'.
 */
export function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (origin && allowed.includes(origin)) {
    return { 'Access-Control-Allow-Origin': origin, ...BASE_HEADERS };
  }
  // Origem não autorizada (ou ausente): sem ACAO header → browser bloqueia.
  return { ...BASE_HEADERS };
}

export function handlePreflight(request: Request, env: Env): Response {
  return new Response(null, { status: 204, headers: corsHeaders(request, env) });
}
