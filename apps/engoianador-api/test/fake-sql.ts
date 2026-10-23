import { QUOTA_STATEMENTS } from '../src/quota/quota-ledger.constants';
import type { SqlCursor, SqlRunner, SqlValue } from '../src/quota/quota.types';

interface StoredReservation {
  readonly key: string;
  readonly day: number;
}

const EMPTY: SqlCursor = { toArray: () => [] };

function rows(list: readonly Record<string, unknown>[]): SqlCursor {
  return { toArray: () => list };
}

/** SQL falso em memória: cada instrução do ledger tem a semântica equivalente em Maps. */
export function createFakeSql(): SqlRunner {
  const counts = new Map<string, number>();
  const reservations = new Map<string, StoredReservation>();
  const slot = (key: SqlValue, day: SqlValue): string => `${String(key)}|${String(day)}`;

  return {
    exec(query: string, ...bindings: readonly SqlValue[]): SqlCursor {
      const [first, second, third] = bindings;
      switch (query) {
        case QUOTA_STATEMENTS.createLedger:
        case QUOTA_STATEMENTS.createReservations:
          return EMPTY;
        case QUOTA_STATEMENTS.purgeLedger:
          for (const stored of [...counts.keys()]) {
            if (Number(stored.split('|')[1]) < Number(first)) counts.delete(stored);
          }
          return EMPTY;
        case QUOTA_STATEMENTS.purgeReservations:
          for (const [id, stored] of [...reservations]) {
            if (stored.day < Number(first)) reservations.delete(id);
          }
          return EMPTY;
        case QUOTA_STATEMENTS.selectCount:
          return rows(counts.has(slot(first as SqlValue, second as SqlValue)) ? [{ count: counts.get(slot(first as SqlValue, second as SqlValue)) }] : []);
        case QUOTA_STATEMENTS.incrementCount:
          counts.set(slot(first as SqlValue, second as SqlValue), (counts.get(slot(first as SqlValue, second as SqlValue)) ?? 0) + 1);
          return EMPTY;
        case QUOTA_STATEMENTS.insertReservation:
          reservations.set(String(first), { key: String(second), day: Number(third) });
          return EMPTY;
        case QUOTA_STATEMENTS.selectReservation: {
          const found = reservations.get(String(first));
          return rows(found === undefined ? [] : [{ key: found.key, day: found.day }]);
        }
        case QUOTA_STATEMENTS.deleteReservation:
          reservations.delete(String(first));
          return EMPTY;
        case QUOTA_STATEMENTS.decrementCount: {
          const name = slot(first as SqlValue, second as SqlValue);
          counts.set(name, Math.max((counts.get(name) ?? 0) - 1, 0));
          return EMPTY;
        }
        default:
          throw new Error(`instrução SQL desconhecida no fake: ${query}`);
      }
    },
  };
}
