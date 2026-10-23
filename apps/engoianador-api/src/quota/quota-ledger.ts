import { QUOTA_STATEMENTS } from './quota-ledger.constants';
import type { LedgerDecision, QuotaLedger, ReserveInput, SqlRunner } from './quota.types';

function readNumber(row: Record<string, unknown> | undefined, field: string): number | null {
  const value = row?.[field];
  return typeof value === 'number' ? value : null;
}

// Tudo é síncrono: o Durable Object processa uma entrada por vez, então
// ler o contador e gravar o novo valor nunca se intercala com outra chamada.
export function createQuotaLedger(sql: SqlRunner): QuotaLedger {
  sql.exec(QUOTA_STATEMENTS.createLedger);
  sql.exec(QUOTA_STATEMENTS.createReservations);

  function currentCount(key: string, day: number): number {
    return readNumber(sql.exec(QUOTA_STATEMENTS.selectCount, key, day).toArray()[0], 'count') ?? 0;
  }

  function reserve(input: ReserveInput): LedgerDecision {
    const day = Math.floor(input.nowSec / input.windowSec);
    sql.exec(QUOTA_STATEMENTS.purgeLedger, day);
    sql.exec(QUOTA_STATEMENTS.purgeReservations, day);
    if (sql.exec(QUOTA_STATEMENTS.selectReservation, input.id).toArray().length > 0) return { ok: true };
    if (currentCount(input.key, day) >= input.limit) {
      return { ok: false, retryAfterSec: (day + 1) * input.windowSec - input.nowSec };
    }
    sql.exec(QUOTA_STATEMENTS.incrementCount, input.key, day);
    sql.exec(QUOTA_STATEMENTS.insertReservation, input.id, input.key, day);
    return { ok: true };
  }

  function refund(id: string): void {
    const row = sql.exec(QUOTA_STATEMENTS.selectReservation, id).toArray()[0];
    const day = readNumber(row, 'day');
    const key = row?.['key'];
    if (day === null || typeof key !== 'string') return;
    sql.exec(QUOTA_STATEMENTS.deleteReservation, id);
    sql.exec(QUOTA_STATEMENTS.decrementCount, key, day);
  }

  return { reserve, refund };
}
