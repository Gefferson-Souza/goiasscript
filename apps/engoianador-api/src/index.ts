import { corsHeaders, handlePreflight } from './cors';
import { rewriteText } from './engoiana';
import type { Env } from './env.types';
import { HTTP_STATUS, JSON_CONTENT_TYPE } from './http.constants';
import { workerLog } from './log';
import { checkRateLimit } from './rate-limit';
import {
  DECIMAL_RADIX,
  DEFAULT_MAX_INPUT_CHARS,
  ERROR_FIELD,
  MESSAGES,
  REQUEST_TEXT_FIELD,
  RESPONSE_TEXT_FIELD,
  STATUS_PAYLOAD,
} from './responses.constants';

type Reply = (body: unknown, status: number, headers?: Readonly<Record<string, string>>) => Response;

const ENGOIANA_PATH = '/engoiana';
const ANONYMOUS_KEY = 'anon';

function makeReply(request: Request, env: Env): Reply {
  return (body, status, headers = {}) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': JSON_CONTENT_TYPE, ...corsHeaders(request, env), ...headers },
    });
}

async function readJsonBody(request: Request): Promise<{ readonly ok: true; readonly value: unknown } | { readonly ok: false }> {
  try {
    return { ok: true, value: await request.json() };
  } catch {
    return { ok: false };
  }
}

function extractText(body: unknown): string {
  if (typeof body !== 'object' || body === null) return '';
  const field = (body as Readonly<Record<string, unknown>>)[REQUEST_TEXT_FIELD];
  return typeof field === 'string' ? field.trim() : '';
}

async function enforceRateLimit(request: Request, env: Env, reply: Reply): Promise<Response | null> {
  // O cf-connecting-ip vem da Cloudflare e não dá para forjar; x-forwarded-for o cliente controla.
  const ip = request.headers.get('cf-connecting-ip') ?? ANONYMOUS_KEY;
  const result = await checkRateLimit(ip, env);
  if (result.ok) return null;
  if (result.reason === 'misconfig') {
    return reply({ [ERROR_FIELD]: MESSAGES.recess }, HTTP_STATUS.serviceUnavailable);
  }
  return reply({ [ERROR_FIELD]: MESSAGES.rateLimited }, HTTP_STATUS.tooManyRequests, { 'Retry-After': String(result.retryAfterSec) });
}

async function handleEngoiana(request: Request, env: Env, reply: Reply): Promise<Response> {
  const body = await readJsonBody(request);
  if (!body.ok) return reply({ [ERROR_FIELD]: MESSAGES.invalidJson }, HTTP_STATUS.badRequest);

  const text = extractText(body.value);
  const maxChars = parseInt(env.MAX_INPUT_CHARS, DECIMAL_RADIX) || DEFAULT_MAX_INPUT_CHARS;
  if (!text) return reply({ [ERROR_FIELD]: MESSAGES.emptyText }, HTTP_STATUS.badRequest);
  if (text.length > maxChars) {
    return reply({ [ERROR_FIELD]: `Cabôu o limite: ${String(maxChars)} caracteres, sô` }, HTTP_STATUS.payloadTooLarge);
  }

  const blocked = await enforceRateLimit(request, env, reply);
  if (blocked) return blocked;

  try {
    const answer = await rewriteText(text, env, workerLog);
    return reply({ [RESPONSE_TEXT_FIELD]: answer }, HTTP_STATUS.ok);
  } catch (error) {
    workerLog.error('engoiana failed', error instanceof Error ? error.message : String(error));
    return reply({ [ERROR_FIELD]: MESSAGES.providerFailed }, HTTP_STATUS.badGateway);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const reply = makeReply(request, env);

    if (request.method === 'OPTIONS') return handlePreflight(request, env);
    if (url.pathname === '/' && request.method === 'GET') return reply(STATUS_PAYLOAD, HTTP_STATUS.ok);
    if (url.pathname === ENGOIANA_PATH && request.method === 'POST') return handleEngoiana(request, env, reply);
    return reply({ [ERROR_FIELD]: MESSAGES.notFound }, HTTP_STATUS.notFound);
  },
};
