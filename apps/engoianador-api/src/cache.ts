import type { ResponseCache } from './ports.types';

export function createCache(): ResponseCache {
  return {
    get: () => Promise.resolve(null),
    put: () => Promise.resolve(),
  };
}
