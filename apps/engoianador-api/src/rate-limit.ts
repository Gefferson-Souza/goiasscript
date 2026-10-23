import { FLAG_ON } from './config.constants';
import type { Env } from './env.types';
import { DEFAULT_RATE_LIMIT_PER_DAY, KEY_PREFIX, KEY_TTL_MARGIN_SEC, MS_PER_SEC, WINDOW_SEC } from './rate-limit.constants';
import type { RateLimitResult } from './rate-limit.types';

interface Bucket {
  readonly count: number;
  readonly windowStart: number;
}

function parseBucket(raw: string | null, now: number): Bucket {
  const fresh: Bucket = { count: 0, windowStart: now };
  if (!raw) return fresh;
  try {
    const parsed = JSON.parse(raw) as Partial<Bucket>;
    const valid = typeof parsed.count === 'number' && typeof parsed.windowStart === 'number' && now - parsed.windowStart < WINDOW_SEC;
    return valid ? { count: parsed.count ?? 0, windowStart: parsed.windowStart ?? now } : fresh;
  } catch {
    return fresh;
  }
}

function readLimit(env: Env): number {
  const parsed = Number(env.RATE_LIMIT_PER_DAY);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_RATE_LIMIT_PER_DAY;
}

// Sem o KV a requisição é recusada, exceto em dev com ALLOW_UNLIMITED="true".
// Em produção nunca libera sem limitador.
export async function checkRateLimit(ip: string, env: Env): Promise<RateLimitResult> {
  const store = env.ENGOIANADOR_RL;
  if (!store) {
    return env.ALLOW_UNLIMITED === FLAG_ON ? { ok: true } : { ok: false, reason: 'misconfig' };
  }
  const limit = readLimit(env);
  const key = `${KEY_PREFIX}${ip}`;
  const now = Math.floor(Date.now() / MS_PER_SEC);
  const bucket = parseBucket(await store.get(key), now);

  if (bucket.count >= limit) {
    return { ok: false, reason: 'rate', retryAfterSec: WINDOW_SEC - (now - bucket.windowStart) };
  }
  const next: Bucket = { count: bucket.count + 1, windowStart: bucket.windowStart };
  await store.put(key, JSON.stringify(next), { expirationTtl: WINDOW_SEC + KEY_TTL_MARGIN_SEC });
  return { ok: true };
}
