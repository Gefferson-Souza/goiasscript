import { corsHeaders, handlePreflight } from './cors';
import type { Env } from './env.types';
import type { HandlerDeps } from './handler.types';
import { HTTP_STATUS, JSON_CONTENT_TYPE } from './http.constants';
import { createLookupGuard } from './lookup-guard';
import type { LookupGuard } from './lookup-guard.types';
import { MESSAGES } from './messages.constants';
import type { QuotaDecision } from './ports.types';
import { networkKeyOf } from './quota/network-key';
import { ERROR_FIELD, RESPONSE_TEXT_FIELD, STATUS_PAYLOAD } from './responses.constants';
import { parseEngoianarRequest } from './validation';

type Reply = (body: unknown, status: number, headers?: Readonly<Record<string, string>>) => Response;
type Refusal = Extract<QuotaDecision, { readonly ok: false }>;

const ENGOIANA_PATH = '/engoiana';
const HEALTH_PATH = '/health';
const ROOT_PATH = '/';
const ANONYMOUS_KEY = 'anon';
const MS_PER_SEC = 1000;

function makeReply(request: Request, env: Env): Reply {
  return (body, status, headers = {}) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': JSON_CONTENT_TYPE, ...corsHeaders(request, env), ...headers },
    });
}

function refusalReply(reply: Reply, refusal: Refusal): Response {
  const retryAfter = refusal.retryAfterSec > 0 ? { 'Retry-After': String(refusal.retryAfterSec) } : {};
  switch (refusal.reason) {
    case 'rate':
      return reply({ [ERROR_FIELD]: MESSAGES.rateLimited }, HTTP_STATUS.tooManyRequests, retryAfter);
    case 'global':
      return reply({ [ERROR_FIELD]: MESSAGES.dailyCap }, HTTP_STATUS.serviceUnavailable, retryAfter);
    case 'kill-switch':
      return reply({ [ERROR_FIELD]: MESSAGES.killSwitch }, HTTP_STATUS.serviceUnavailable);
    case 'misconfig':
      return reply({ [ERROR_FIELD]: MESSAGES.recess }, HTTP_STATUS.serviceUnavailable);
  }
}

async function readCache(deps: HandlerDeps, text: string): Promise<string | null> {
  try {
    return await deps.cache.get(text);
  } catch {
    deps.log.warn('cache read failed');
    return null;
  }
}

async function writeCache(deps: HandlerDeps, text: string, answer: string): Promise<void> {
  try {
    await deps.cache.put(text, answer);
  } catch {
    deps.log.warn('cache write failed');
    return;
  }
}

async function refundQuietly(deps: HandlerDeps, reservation: string): Promise<void> {
  try {
    await deps.limiter.refund(reservation);
  } catch {
    deps.log.warn('quota refund failed');
    return;
  }
}

async function engoiana(request: Request, deps: HandlerDeps, reply: Reply, guard: LookupGuard): Promise<Response> {
  if (deps.config.killSwitch) return reply({ [ERROR_FIELD]: MESSAGES.killSwitch }, HTTP_STATUS.serviceUnavailable);
  const parsed = await parseEngoianarRequest(request, deps.config);
  if (!parsed.ok) return reply({ [ERROR_FIELD]: parsed.error }, parsed.status);

  // O cf-connecting-ip vem da Cloudflare e não dá para forjar; x-forwarded-for o cliente controla.
  // O guarda agrupa IPv6 pelo /64, como a cota: girar endereço do bloco não abre janela nova.
  const networkKey = request.headers.get('cf-connecting-ip') ?? ANONYMOUS_KEY;
  const lookup = guard.check(networkKeyOf(networkKey), Date.now());
  if (!lookup.allowed) {
    return reply({ [ERROR_FIELD]: MESSAGES.tooFast }, HTTP_STATUS.tooManyRequests, { 'Retry-After': String(lookup.retryAfterSec) });
  }

  const cached = await readCache(deps, parsed.text);
  if (cached !== null) return reply({ [RESPONSE_TEXT_FIELD]: cached }, HTTP_STATUS.ok);

  const decision = await deps.limiter.reserve(networkKey, Math.floor(Date.now() / MS_PER_SEC));
  if (!decision.ok) return refusalReply(reply, decision);

  const result = await deps.providers.complete(parsed.text, request.signal);
  if (!result.ok) {
    await refundQuietly(deps, decision.reservation);
    return reply({ [ERROR_FIELD]: MESSAGES.providerFailed }, HTTP_STATUS.badGateway);
  }
  await writeCache(deps, parsed.text, result.text);
  return reply({ [RESPONSE_TEXT_FIELD]: result.text }, HTTP_STATUS.ok);
}

function healthReply(deps: HandlerDeps, reply: Reply): Response {
  const report = deps.health();
  return reply(report, report.ok ? HTTP_STATUS.ok : HTTP_STATUS.serviceUnavailable);
}

async function route(request: Request, deps: HandlerDeps, reply: Reply, guard: LookupGuard): Promise<Response> {
  const { pathname } = new URL(request.url);
  if (pathname === ROOT_PATH && request.method === 'GET') return reply(STATUS_PAYLOAD, HTTP_STATUS.ok);
  if (pathname === HEALTH_PATH && request.method === 'GET') return healthReply(deps, reply);
  if (pathname === ENGOIANA_PATH && request.method === 'POST') return engoiana(request, deps, reply, guard);
  return reply({ [ERROR_FIELD]: MESSAGES.notFound }, HTTP_STATUS.notFound);
}

export function createHandler(deps: HandlerDeps): (request: Request, env: Env) => Promise<Response> {
  const guard = createLookupGuard();
  return async (request, env) => {
    if (request.method === 'OPTIONS') return handlePreflight(request, env);
    const reply = makeReply(request, env);
    try {
      return await route(request, deps, reply, guard);
    } catch (error) {
      deps.log.error('request failed', error instanceof Error ? error.name : 'unknown');
      return reply({ [ERROR_FIELD]: MESSAGES.internal }, HTTP_STATUS.internalError);
    }
  };
}
