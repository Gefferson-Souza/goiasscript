import { describe, expect, it } from 'vitest';
import config from '../stryker.config.mjs';

describe('stryker do cli', () => {
  it('é incremental e deixa o entry de fora', () => {
    expect(config.incremental).toBe(true);
    expect(config.mutate).toContain('!src/entry/**');
  });
  it('é só relatório: não quebra o job por nota', () => {
    expect(config.thresholds.break).toBeNull();
  });
});
