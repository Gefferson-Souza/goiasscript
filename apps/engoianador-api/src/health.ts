import type { Env, WorkerConfig } from './env.types';
import type { HealthReport } from './ports.types';

function hasText(value: string | undefined): boolean {
  return value !== undefined && value !== '';
}

/** Reporta só presença de binding e segredo, nunca o valor; não toca provedor, cota nem cache. */
export function buildHealthReport(env: Env, config: WorkerConfig): HealthReport {
  const bindings = {
    QUOTA_LEDGER: Boolean(env.QUOTA_LEDGER),
    ENGOIANADOR_CACHE: Boolean(env.ENGOIANADOR_CACHE),
    AI: env.AI !== undefined,
    GROQ_API_KEY: hasText(env.GROQ_API_KEY),
  };
  const ok = bindings.QUOTA_LEDGER && bindings.ENGOIANADOR_CACHE && (bindings.AI || bindings.GROQ_API_KEY);
  return { ok, model: config.groqModel, bindings };
}
