export type SqlValue = string | number;

export interface SqlCursor {
  toArray(): readonly Record<string, unknown>[];
}

export interface SqlRunner {
  exec(query: string, ...bindings: readonly SqlValue[]): SqlCursor;
}

export interface ReserveInput {
  readonly key: string;
  readonly limit: number;
  readonly windowSec: number;
  readonly nowSec: number;
  readonly id: string;
}

export type LedgerDecision =
  | { readonly ok: true }
  | { readonly ok: false; readonly retryAfterSec: number };

export interface QuotaLedger {
  reserve(input: ReserveInput): LedgerDecision;
  refund(id: string): void;
}

export interface ParsedReservation {
  readonly day: number;
  readonly id: string;
  readonly networkKey: string;
}
