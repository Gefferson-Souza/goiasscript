import { describe, expect, it, vi } from 'vitest';
import { createHandler } from '../src/handler';
import { createLimiter } from '../src/limiter';
import type { ProviderChain } from '../src/ports.types';
import { SECONDS_PER_DAY } from '../src/quota/quota-ledger.constants';
import { createFakeNamespace } from './fake-quota';
import { jsonRequest, makeConfig, makeEnv } from './helpers';

const NOW = 1_800_000_000;
const IPV6_A = '2001:db8:1:2::1';
const IPV6_SAME_PREFIX = '2001:db8:1:2:ffff::9';
const IPV6_OTHER_PREFIX = '2001:db8:1:3::1';

function setup(configOverrides = {}, namespaceOptions = {}) {
  const fake = createFakeNamespace(namespaceOptions);
  const env = makeEnv({ QUOTA_LEDGER: fake.namespace });
  const limiter = createLimiter(env, makeConfig(configOverrides));
  return { fake, limiter };
}

describe('createLimiter', () => {
  it('nega por rede e devolve a global', async () => {
    const { limiter } = setup({ rateLimitPerDay: 1, globalDailyCap: 2 });
    expect((await limiter.reserve('203.0.113.7', NOW)).ok).toBe(true);
    const denied = await limiter.reserve('203.0.113.7', NOW);
    expect(denied).toMatchObject({ ok: false, reason: 'rate' });
    expect((await limiter.reserve('203.0.113.8', NOW)).ok).toBe(true);
    expect(await limiter.reserve('203.0.113.9', NOW)).toMatchObject({ ok: false, reason: 'global' });
  });

  it('informa o Retry-After até a virada do dia UTC', async () => {
    const { limiter } = setup({ rateLimitPerDay: 1 });
    const dayStart = Math.floor(NOW / SECONDS_PER_DAY) * SECONDS_PER_DAY;
    await limiter.reserve('203.0.113.7', dayStart + 10);
    expect(await limiter.reserve('203.0.113.7', dayStart + 10)).toEqual({ ok: false, reason: 'rate', retryAfterSec: SECONDS_PER_DAY - 10 });
  });

  it('teto global nega com reason global', async () => {
    const { limiter } = setup({ globalDailyCap: 1 });
    await limiter.reserve('203.0.113.7', NOW);
    expect(await limiter.reserve('203.0.113.8', NOW)).toMatchObject({ ok: false, reason: 'global' });
  });

  it('dois IPv6 do mesmo /64 dividem a cota, de /64 diferentes não', async () => {
    const { limiter } = setup({ rateLimitPerDay: 1 });
    expect((await limiter.reserve(IPV6_A, NOW)).ok).toBe(true);
    expect(await limiter.reserve(IPV6_SAME_PREFIX, NOW)).toMatchObject({ ok: false, reason: 'rate' });
    expect((await limiter.reserve(IPV6_OTHER_PREFIX, NOW)).ok).toBe(true);
  });

  it('refund volta a cota da rede e a global', async () => {
    const { limiter } = setup({ rateLimitPerDay: 1, globalDailyCap: 1 });
    const first = await limiter.reserve('203.0.113.7', NOW);
    if (!first.ok) throw new Error('esperava reserva');
    await limiter.refund(first.reservation);
    await limiter.refund(first.reservation);
    expect((await limiter.reserve('203.0.113.7', NOW)).ok).toBe(true);
    expect((await limiter.reserve('203.0.113.7', NOW)).ok).toBe(false);
  });

  it('refund de reserva malformada é ignorado', async () => {
    const { limiter } = setup();
    await expect(limiter.refund('lixo')).resolves.toBeUndefined();
  });

  it('DO que lança vira misconfig', async () => {
    const { limiter } = setup({}, { failWith: new Error('DO fora do ar') });
    expect(await limiter.reserve('203.0.113.7', NOW)).toEqual({ ok: false, reason: 'misconfig', retryAfterSec: 0 });
  });

  it('kill switch não chama o DO', async () => {
    const { fake, limiter } = setup({ killSwitch: true });
    expect(await limiter.reserve('203.0.113.7', NOW)).toMatchObject({ ok: false, reason: 'kill-switch' });
    expect(fake.fetchCount()).toBe(0);
  });

  it('não grava texto do usuário nem IP bruto de IPv6 nos nomes dos objetos', async () => {
    const { fake, limiter } = setup();
    await limiter.reserve(IPV6_A, NOW);
    expect(fake.objectNames().join(' ')).not.toContain('::1');
  });

  it('provedor em erro devolve a reserva pelo handler', async () => {
    const fake = createFakeNamespace();
    const env = makeEnv({ QUOTA_LEDGER: fake.namespace });
    const config = makeConfig({ rateLimitPerDay: 1, globalDailyCap: 1 });
    const providers: ProviderChain = { complete: vi.fn(() => Promise.resolve({ ok: false as const, failure: 'server-error' as const, provider: 'fake' })) };
    const handler = createHandler({
      limiter: createLimiter(env, config),
      providers,
      cache: { get: () => Promise.resolve(null), put: () => Promise.resolve() },
      health: () => ({ ok: true, model: 'm', bindings: {} }),
      config,
      log: { warn: vi.fn(), error: vi.fn() },
    });
    const post = () => handler(jsonRequest('{"text":"oi"}'), env);
    expect((await post()).status).toBe(502);
    expect((await post()).status).toBe(502);
  });
});
