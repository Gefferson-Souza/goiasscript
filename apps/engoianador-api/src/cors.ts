import { ORIGIN_SEPARATOR } from './config.constants';
import { HTTP_STATUS } from './http.constants';
import type { Env } from './env.types';

const BASE_HEADERS: Readonly<Record<string, string>> = {
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-user-api-key',
  'Access-Control-Max-Age': '86400',
  Vary: 'Origin',
};

// Sem a origem na allowlist o header Access-Control-Allow-Origin não sai:
// o navegador bloqueia a chamada. Nunca usa curinga.
export function corsHeaders(request: Request, env: Env): Readonly<Record<string, string>> {
  const origin = request.headers.get('Origin') ?? '';
  const allowed = (env.ALLOWED_ORIGINS || '')
    .split(ORIGIN_SEPARATOR)
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (origin !== '' && allowed.includes(origin)) {
    return { 'Access-Control-Allow-Origin': origin, ...BASE_HEADERS };
  }
  return { ...BASE_HEADERS };
}

export function handlePreflight(request: Request, env: Env): Response {
  return new Response(null, { status: HTTP_STATUS.noContent, headers: corsHeaders(request, env) });
}
