import { createCache } from './cache';
import { parseConfig } from './config';
import { corsHeaders } from './cors';
import type { ConfigResult, Env } from './env.types';
import { createHandler } from './handler';
import { createHealth } from './health';
import { HTTP_STATUS, JSON_CONTENT_TYPE } from './http.constants';
import { createLimiter } from './limiter';
import { workerLog } from './log';
import { MESSAGES } from './messages.constants';
import { createWorkerProviderChain } from './providers';
import { QuotaLedgerObject } from './rate-limiter.do';
import { ERROR_FIELD } from './responses.constants';

export { QuotaLedgerObject };

type Handler = (request: Request, env: Env) => Promise<Response>;

// Env é o mesmo objeto durante a vida do isolate: a configuração é lida uma vez.
const configByEnv = new WeakMap<Env, ConfigResult>();
const handlerByEnv = new WeakMap<Env, Handler>();

function loadConfig(env: Env): ConfigResult {
  const known = configByEnv.get(env);
  if (known !== undefined) return known;
  const parsed = parseConfig(env);
  configByEnv.set(env, parsed);
  return parsed;
}

function invalidConfigResponse(request: Request, env: Env, problems: readonly string[]): Response {
  workerLog.error('invalid config', problems.join('; '));
  return new Response(JSON.stringify({ [ERROR_FIELD]: MESSAGES.recess }), {
    status: HTTP_STATUS.serviceUnavailable,
    headers: { 'Content-Type': JSON_CONTENT_TYPE, ...corsHeaders(request, env) },
  });
}

function handlerFor(env: Env, config: Extract<ConfigResult, { readonly ok: true }>['config']): Handler {
  const known = handlerByEnv.get(env);
  if (known !== undefined) return known;
  const handler = createHandler({
    limiter: createLimiter(env, config),
    providers: createWorkerProviderChain({ env, config, log: workerLog }),
    cache: createCache(),
    health: createHealth(env),
    config,
    log: workerLog,
  });
  handlerByEnv.set(env, handler);
  return handler;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const parsed = loadConfig(env);
    if (!parsed.ok) return invalidConfigResponse(request, env, parsed.problems);
    return handlerFor(env, parsed.config)(request, env);
  },
};
