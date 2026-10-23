import { cacheKeyOf } from './cache-key';
import { CACHE_READ_FAILED, CACHE_WRITE_FAILED, KV_MIN_TTL_SEC } from './cache.constants';
import type { CacheOptions } from './cache.types';
import type { ResponseCache } from './ports.types';

export function createCache(options: CacheOptions): ResponseCache {
  const { kv, log, promptVersion, modelId } = options;
  const expirationTtl = Math.max(options.ttlSec, KV_MIN_TTL_SEC);
  return {
    async get(text) {
      try {
        return await kv.get(await cacheKeyOf(text, promptVersion, modelId));
      } catch {
        log.warn(CACHE_READ_FAILED);
        return null;
      }
    },
    async put(text, answer) {
      try {
        await kv.put(await cacheKeyOf(text, promptVersion, modelId), answer, { expirationTtl });
      } catch {
        log.warn(CACHE_WRITE_FAILED);
        return;
      }
    },
  };
}
