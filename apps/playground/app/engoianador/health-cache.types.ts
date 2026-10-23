import type { EngoianadorHealth } from '../../lib/engoianador-client.types.ts';

export interface HealthCacheEntry {
  readonly health: EngoianadorHealth;
  readonly storedAt: number;
}
