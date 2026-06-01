import { describe, it, expect } from 'vitest';
import { checkRateLimit } from '../src/rate-limit';
import { fakeKV, makeEnv } from './helpers';

describe('checkRateLimit — fail-closed', () => {
  it('recusa com misconfig quando não há KV e não é dev', async () => {
    const r = await checkRateLimit('1.2.3.4', makeEnv({ ENGOIANADOR_RL: undefined }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('misconfig');
  });

  it('libera sem KV apenas com ALLOW_UNLIMITED=true (dev)', async () => {
    const r = await checkRateLimit('1.2.3.4', makeEnv({ ALLOW_UNLIMITED: 'true' }));
    expect(r.ok).toBe(true);
  });

  it('permite até o limite diário e bloqueia depois', async () => {
    const kv = fakeKV();
    const env = makeEnv({ ENGOIANADOR_RL: kv as never, RATE_LIMIT_PER_DAY: '3' });
    const ip = '9.9.9.9';
    expect((await checkRateLimit(ip, env)).ok).toBe(true);
    expect((await checkRateLimit(ip, env)).ok).toBe(true);
    expect((await checkRateLimit(ip, env)).ok).toBe(true);
    const quarta = await checkRateLimit(ip, env);
    expect(quarta.ok).toBe(false);
    if (!quarta.ok && quarta.reason === 'rate') {
      expect(quarta.retryAfterSec).toBeGreaterThan(0);
    } else {
      throw new Error('esperava reason rate');
    }
  });

  it('conta por IP separadamente', async () => {
    const kv = fakeKV();
    const env = makeEnv({ ENGOIANADOR_RL: kv as never, RATE_LIMIT_PER_DAY: '1' });
    expect((await checkRateLimit('a', env)).ok).toBe(true);
    expect((await checkRateLimit('a', env)).ok).toBe(false);
    expect((await checkRateLimit('b', env)).ok).toBe(true);
  });

  it('reseta contagem se o bucket no KV estiver corrompido', async () => {
    const kv = fakeKV();
    kv.store.set('rl:x', 'isso não é json');
    const env = makeEnv({ ENGOIANADOR_RL: kv as never, RATE_LIMIT_PER_DAY: '5' });
    const r = await checkRateLimit('x', env);
    expect(r.ok).toBe(true);
  });
});
