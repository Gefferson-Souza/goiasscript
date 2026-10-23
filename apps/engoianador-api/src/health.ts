import type { Env } from './env.types';
import type { HealthReport } from './ports.types';

export function createHealth(env: Env): () => HealthReport {
  return () => ({
    ok: true,
    model: env.GROQ_MODEL,
    bindings: {
      QUOTA_LEDGER: Boolean(env.QUOTA_LEDGER),
      ENGOIANADOR_CACHE: Boolean(env.ENGOIANADOR_CACHE),
      AI: env.AI !== undefined,
      GROQ_API_KEY: env.GROQ_API_KEY !== undefined && env.GROQ_API_KEY !== '',
    },
  });
}
