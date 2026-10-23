import { describe, expect, it, vi } from 'vitest';
import { cacheKeyOf } from '../src/cache-key';
import { createCache } from '../src/cache';
import type { CacheOptions, KvPort } from '../src/cache.types';

const PROMPT = 'p1';
const MODEL = 'm1';

interface FakeKv extends KvPort {
  readonly store: Map<string, string>;
  readonly puts: { readonly key: string; readonly expirationTtl: number }[];
}

function makeKv(): FakeKv {
  const store = new Map<string, string>();
  const puts: { key: string; expirationTtl: number }[] = [];
  return {
    store,
    puts,
    get: (key) => Promise.resolve(store.get(key) ?? null),
    put: (key, value, options) => {
      store.set(key, value);
      puts.push({ key, expirationTtl: options.expirationTtl });
      return Promise.resolve();
    },
  };
}

function build(kv: KvPort, overrides: Partial<CacheOptions> = {}) {
  const log = { warn: vi.fn(), error: vi.fn() };
  const cache = createCache({ kv, ttlSec: 3600, promptVersion: PROMPT, modelId: MODEL, log, ...overrides });
  return { cache, log };
}

describe('createCache', () => {
  it('put e get devolvem a resposta', async () => {
    const { cache } = build(makeKv());
    await cache.put('oi  sô', 'uai');
    expect(await cache.get('oi sô')).toBe('uai');
    expect(await cache.get('outro')).toBeNull();
  });

  it('grava sob a chave derivada do texto normalizado', async () => {
    const kv = makeKv();
    await build(kv).cache.put('oi', 'uai');
    expect([...kv.store.keys()]).toEqual([await cacheKeyOf('oi', PROMPT, MODEL)]);
  });

  it('erro de leitura vira miss', async () => {
    const kv: KvPort = { ...makeKv(), get: () => Promise.reject(new Error('kv fora')) };
    const { cache, log } = build(kv);
    expect(await cache.get('oi')).toBeNull();
    expect(log.warn).toHaveBeenCalledTimes(1);
  });

  it('erro de escrita é engolido e registrado sem o texto', async () => {
    const kv: KvPort = { ...makeKv(), put: () => Promise.reject(new Error('kv fora')) };
    const { cache, log } = build(kv);
    await expect(cache.put('texto-secreto', 'uai')).resolves.toBeUndefined();
    expect(log.warn).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(log.warn.mock.calls)).not.toContain('texto-secreto');
  });

  it('aplica o TTL configurado', async () => {
    const kv = makeKv();
    await build(kv, { ttlSec: 21_600 }).cache.put('oi', 'uai');
    expect(kv.puts[0]?.expirationTtl).toBe(21_600);
  });

  it('nunca usa TTL abaixo do mínimo do KV', async () => {
    const kv = makeKv();
    await build(kv, { ttlSec: 5 }).cache.put('oi', 'uai');
    expect(kv.puts[0]?.expirationTtl).toBeGreaterThanOrEqual(60);
  });

  it('trocar o modelo ou o prompt não acerta o item antigo', async () => {
    const kv = makeKv();
    await build(kv).cache.put('oi', 'uai');
    expect(await build(kv, { modelId: 'm2' }).cache.get('oi')).toBeNull();
    expect(await build(kv, { promptVersion: 'p2' }).cache.get('oi')).toBeNull();
  });
});
