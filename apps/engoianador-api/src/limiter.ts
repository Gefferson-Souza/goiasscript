import type { Env } from './env.types';
import type { QuotaLimiter } from './ports.types';
import { checkRateLimit } from './rate-limit';

export function createLimiter(env: Env): QuotaLimiter {
  return {
    async reserve(networkKey) {
      const result = await checkRateLimit(networkKey, env);
      if (result.ok) return { ok: true, reservation: networkKey };
      return { ok: false, reason: result.reason, retryAfterSec: result.reason === 'rate' ? result.retryAfterSec : 0 };
    },
    refund: () => Promise.resolve(),
  };
}
