import { describe, expect, it } from 'vitest';
import config from '../stryker.config.mjs';

describe('stryker', () => {
  it('é incremental e cobre o núcleo', () => {
    expect(config.incremental).toBe(true);
    expect(config.mutate.some((glob) => glob.includes('src/parser'))).toBe(true);
  });
  it('depois do gate, break é numérico e positivo', () => {
    expect(typeof config.thresholds.break).toBe('number');
    expect(config.thresholds.break).toBeGreaterThan(0);
  });
});
