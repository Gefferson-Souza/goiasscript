import type { EngoianadorHealth } from '../../lib/engoianador-client.types.ts';

export interface EngoianadorHealthState {
  readonly health: EngoianadorHealth;
  readonly recheck: () => void;
}
