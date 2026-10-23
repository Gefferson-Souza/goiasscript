import { beforeEach, describe, expect, it } from 'vitest';
import {
  HEALTH_CACHE_TTL_MS,
  clearHealthCache,
  readCachedHealth,
  storeHealth,
} from '../app/engoianador/health-cache.ts';

const URL_A = 'https://engoianador.example.org';

describe('cache da checagem de saúde', () => {
  beforeEach(clearHealthCache);

  it('reaproveita o resultado up dentro do prazo', () => {
    storeHealth(URL_A, 'up', 1000);
    expect(readCachedHealth(URL_A, 1000 + HEALTH_CACHE_TTL_MS - 1)).toBe('up');
  });

  it('expira depois do prazo', () => {
    storeHealth(URL_A, 'up', 1000);
    expect(readCachedHealth(URL_A, 1000 + HEALTH_CACHE_TTL_MS)).toBeNull();
  });

  it('não guarda down, para a nova checagem ir de verdade na rede', () => {
    storeHealth(URL_A, 'up', 1000);
    storeHealth(URL_A, 'down', 2000);
    expect(readCachedHealth(URL_A, 2001)).toBeNull();
  });
});
