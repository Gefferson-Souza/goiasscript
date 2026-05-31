import type { Env } from './engoiana';

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

const WINDOW_SEC = 60;

export async function checkRateLimit(ip: string, env: Env): Promise<RateLimitResult> {
  if (!env.ENGOIANADOR_RL) {
    // Sem KV configurado (ex.: ambiente dev sem namespace). Libera tudo.
    return { ok: true };
  }
  const limit = parseInt(env.RATE_LIMIT_PER_MINUTE || '10', 10);
  const key = `rl:${ip}`;
  const now = Math.floor(Date.now() / 1000);

  const raw = await env.ENGOIANADOR_RL.get(key);
  let count = 0;
  let windowStart = now;

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { count: number; windowStart: number };
      if (now - parsed.windowStart < WINDOW_SEC) {
        count = parsed.count;
        windowStart = parsed.windowStart;
      }
    } catch {
      /* corrompido — reseta */
    }
  }

  if (count >= limit) {
    return { ok: false, retryAfterSec: WINDOW_SEC - (now - windowStart) };
  }

  count += 1;
  await env.ENGOIANADOR_RL.put(
    key,
    JSON.stringify({ count, windowStart }),
    { expirationTtl: WINDOW_SEC + 5 }
  );
  return { ok: true };
}
