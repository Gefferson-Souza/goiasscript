import { describe, expect, it, vi } from 'vitest';
import { loadOnce } from '../lib/load-once.ts';

describe('loadOnce', () => {
  it('carrega uma vez e reaproveita o resultado', async () => {
    const load = vi.fn(() => Promise.resolve('modulo'));
    const get = loadOnce(load);
    expect(await get()).toBe('modulo');
    expect(await get()).toBe('modulo');
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('não guarda a falha e tenta de novo', async () => {
    const load = vi.fn<() => Promise<string>>().mockRejectedValueOnce(new Error('caiu')).mockResolvedValue('modulo');
    const get = loadOnce(load);
    await expect(get()).rejects.toThrow('caiu');
    expect(await get()).toBe('modulo');
    expect(load).toHaveBeenCalledTimes(2);
  });
});
