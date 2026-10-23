import type { Env } from '../src/env.types';

type EnvOverrides = { readonly [Key in keyof Env]?: Env[Key] | undefined };

/** KV em memória que imita a interface usada por rate-limit.ts. */
export function fakeKV() {
  const store = new Map<string, string>();
  return {
    store,
    get: (key: string) => Promise.resolve(store.get(key) ?? null),
    put: (key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    },
    delete: (key: string) => {
      store.delete(key);
      return Promise.resolve();
    },
  };
}

export function makeEnv(overrides: EnvOverrides = {}): Env {
  return {
    GROQ_MODEL: 'llama-3.1-70b-versatile',
    WORKERS_AI_MODEL: '@cf/meta/llama-3.1-8b-instruct',
    ALLOWED_ORIGINS: 'https://playground.goiasscript.com.br',
    RATE_LIMIT_PER_DAY: '20',
    GLOBAL_DAILY_CAP: '2000',
    MAX_INPUT_CHARS: '2000',
    MAX_BODY_BYTES: '8192',
    CACHE_TTL_SEC: '21600',
    QUOTA_LEDGER: {} as DurableObjectNamespace,
    ENGOIANADOR_CACHE: {} as KVNamespace,
    ...overrides,
  } as Env;
}
