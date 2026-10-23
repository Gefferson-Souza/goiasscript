import type { EngoianadorHealth } from '../../lib/engoianador-client.types.ts';
import type { HealthCacheEntry } from './health-cache.types.ts';

export const HEALTH_CACHE_TTL_MS = 60_000;

let entries: ReadonlyMap<string, HealthCacheEntry> = new Map();

/** Só o resultado `up` fica guardado: falha transitória não pode prender o aviso de folga. */
export function readCachedHealth(url: string, now: number): EngoianadorHealth | null {
  const entry = entries.get(url);
  if (entry === undefined || now - entry.storedAt >= HEALTH_CACHE_TTL_MS) return null;
  return entry.health;
}

export function storeHealth(url: string, health: EngoianadorHealth, now: number): void {
  const kept = [...entries].filter(([key]) => key !== url);
  entries = new Map(health === 'up' ? [...kept, [url, { health, storedAt: now }]] : kept);
}

export function clearHealthCache(): void {
  entries = new Map();
}
