import type { Env } from './engoiana';

export type RateLimitResult =
  | { ok: true }
  | { ok: false; reason: 'rate'; retryAfterSec: number }
  | { ok: false; reason: 'misconfig' };

const WINDOW_SEC = 24 * 60 * 60; // janela diária (plano: 20 req/dia)

type Bucket = { count: number; windowStart: number };

function parseBucket(raw: string | null, now: number): Bucket {
  if (!raw) return { count: 0, windowStart: now };
  try {
    const parsed = JSON.parse(raw) as Partial<Bucket>;
    if (
      typeof parsed.count === 'number' &&
      typeof parsed.windowStart === 'number' &&
      now - parsed.windowStart < WINDOW_SEC
    ) {
      return { count: parsed.count, windowStart: parsed.windowStart };
    }
  } catch {
    /* corrompido — reseta */
  }
  return { count: 0, windowStart: now };
}

/**
 * Rate limit por IP via KV. FAIL-CLOSED: se o KV não estiver configurado e o
 * ambiente não permitir explicitamente (ALLOW_UNLIMITED="true", só em dev),
 * recusa a requisição com reason 'misconfig'. Em produção, nunca libera sem KV.
 */
export async function checkRateLimit(ip: string, env: Env): Promise<RateLimitResult> {
  if (!env.ENGOIANADOR_RL) {
    if (env.ALLOW_UNLIMITED === 'true') return { ok: true }; // só dev
    return { ok: false, reason: 'misconfig' };
  }

  const limit = parseInt(env.RATE_LIMIT_PER_DAY || '20', 10);
  const key = `rl:${ip}`;
  const now = Math.floor(Date.now() / 1000);

  const bucket = parseBucket(await env.ENGOIANADOR_RL.get(key), now);

  if (bucket.count >= limit) {
    return { ok: false, reason: 'rate', retryAfterSec: WINDOW_SEC - (now - bucket.windowStart) };
  }

  const next: Bucket = { count: bucket.count + 1, windowStart: bucket.windowStart };
  await env.ENGOIANADOR_RL.put(key, JSON.stringify(next), {
    expirationTtl: WINDOW_SEC + 60,
  });
  return { ok: true };
}
