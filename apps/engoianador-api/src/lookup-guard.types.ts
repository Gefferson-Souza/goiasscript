export interface LookupGuardDecision {
  readonly allowed: boolean;
  readonly retryAfterSec: number;
}

export interface LookupGuard {
  check(networkKey: string, nowMs: number): LookupGuardDecision;
}
