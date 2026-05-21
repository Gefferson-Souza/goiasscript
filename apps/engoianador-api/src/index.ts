import { engoianarTexto, type Env } from './engoiana';
import { checkRateLimit } from './rate-limit';
import { corsHeaders, handlePreflight } from './cors';

const STATUS = {
  ok: '🪄 Engoianador no ar, sô!',
  versao: '1.5.0',
  endpoints: {
    'POST /engoiana': 'Engoiana um texto. Body: { "texto": "..." }',
  },
};

function jsonResponse(body: unknown, init: ResponseInit, request: Request, env: Env): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(request, env),
      ...(init.headers || {}),
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return handlePreflight(request, env);

    if (url.pathname === '/' && request.method === 'GET') {
      return jsonResponse(STATUS, { status: 200 }, request, env);
    }

    if (url.pathname === '/engoiana' && request.method === 'POST') {
      return handleEngoiana(request, env);
    }

    return jsonResponse(
      { erro: 'Cabôu o caminho, sô. Tenta POST /engoiana' },
      { status: 404 },
      request,
      env
    );
  },
};

async function handleEngoiana(request: Request, env: Env): Promise<Response> {
  let body: { texto?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ erro: 'JSON inválido, ô rapaz' }, { status: 400 }, request, env);
  }

  const texto = typeof body.texto === 'string' ? body.texto.trim() : '';
  const maxChars = parseInt(env.MAX_INPUT_CHARS || '2000', 10);

  if (!texto) {
    return jsonResponse(
      { erro: 'Manda um texto de verdade, ô rapaz' },
      { status: 400 },
      request,
      env
    );
  }
  if (texto.length > maxChars) {
    return jsonResponse(
      { erro: `Cabôu o limite: ${maxChars} caracteres, sô` },
      { status: 413 },
      request,
      env
    );
  }

  const ip =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for') ||
    'anon';
  const rl = await checkRateLimit(ip, env);
  if (!rl.ok) {
    return jsonResponse(
      { erro: `Calma aí, sô! Espera ${rl.retryAfterSec}s pra engoianar de novo.` },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfterSec) },
      },
      request,
      env
    );
  }

  try {
    const engoianado = await engoianarTexto(texto, env);
    return jsonResponse({ engoianado }, { status: 200 }, request, env);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('engoiana erro:', message);
    return jsonResponse(
      { erro: 'Ô rapaz! Deu ruim no engoianador. Tenta de novo daqui a pouco.' },
      { status: 502 },
      request,
      env
    );
  }
}
