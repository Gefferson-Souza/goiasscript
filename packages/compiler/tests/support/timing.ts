import { expect } from 'vitest';

// O Stryker roda a suíte instrumentada e em paralelo, onde o relógio não mede o código de produção.
export const timingEnforced = process.env['GS_TIMING_BUDGETS'] !== 'skip';

export function expectWithinBudget(elapsedMs: number, limitMs: number): void {
  if (timingEnforced) expect(elapsedMs).toBeLessThan(limitMs);
}
