import type { Env } from '../src/engoiana';

/** KV em memória que imita a interface usada por rate-limit.ts. */
export function fakeKV() {
  const store = new Map<string, string>();
  return {
    store,
    get: async (key: string) => store.get(key) ?? null,
    put: async (key: string, value: string) => {
      store.set(key, value);
    },
    delete: async (key: string) => {
      store.delete(key);
    },
  };
}

export function makeEnv(overrides: Partial<Env> = {}): Env {
  return {
    ALLOWED_ORIGINS: 'https://playground.goiasscript.com.br',
    RATE_LIMIT_PER_DAY: '20',
    MAX_INPUT_CHARS: '2000',
    ...overrides,
  } as Env;
}
