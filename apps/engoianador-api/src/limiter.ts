import type { Env, WorkerConfig } from './env.types';
import type { QuotaDecision, QuotaLimiter } from './ports.types';
import { networkKeyOf } from './quota/network-key';
import {
  GLOBAL_OBJECT_PREFIX,
  LEDGER_PATHS,
  NETWORK_OBJECT_PREFIX,
  SECONDS_PER_DAY,
} from './quota/quota-ledger.constants';
import type { LedgerDecision } from './quota/quota.types';
import { formatReservation, parseReservation } from './quota/reservation';

const LEDGER_ORIGIN = 'https://quota.internal';
const GLOBAL_LEDGER_KEY = 'global';

const MISCONFIG: QuotaDecision = { ok: false, reason: 'misconfig', retryAfterSec: 0 };
const KILL_SWITCH: QuotaDecision = { ok: false, reason: 'kill-switch', retryAfterSec: 0 };

async function callLedger(env: Env, objectName: string, path: string, payload: unknown): Promise<unknown> {
  const stub = env.QUOTA_LEDGER.get(env.QUOTA_LEDGER.idFromName(objectName));
  const response = await stub.fetch(`${LEDGER_ORIGIN}${path}`, { method: 'POST', body: JSON.stringify(payload) });
  if (!response.ok) throw new Error('ledger respondeu com erro');
  return response.json();
}

function toLedgerDecision(raw: unknown): LedgerDecision {
  const candidate = raw as Partial<{ ok: boolean; retryAfterSec: number }> | null;
  if (candidate?.ok === true) return { ok: true };
  if (candidate?.ok === false && typeof candidate.retryAfterSec === 'number') return { ok: false, retryAfterSec: candidate.retryAfterSec };
  throw new Error('resposta do ledger fora do contrato');
}

function globalObjectName(day: number): string {
  return `${GLOBAL_OBJECT_PREFIX}${String(day)}`;
}

function networkObjectName(networkKey: string): string {
  return `${NETWORK_OBJECT_PREFIX}${networkKey}`;
}

export function createLimiter(env: Env, config: WorkerConfig): QuotaLimiter {
  async function reserveAt(objectName: string, limit: number, key: string, nowSec: number, id: string): Promise<LedgerDecision> {
    const raw = await callLedger(env, objectName, LEDGER_PATHS.reserve, { key, limit, windowSec: SECONDS_PER_DAY, nowSec, id });
    return toLedgerDecision(raw);
  }

  async function refundAt(objectName: string, id: string): Promise<void> {
    await callLedger(env, objectName, LEDGER_PATHS.refund, { id });
  }

  async function reserveBoth(networkKey: string, nowSec: number): Promise<QuotaDecision> {
    const day = Math.floor(nowSec / SECONDS_PER_DAY);
    const key = networkKeyOf(networkKey);
    const id = crypto.randomUUID();
    const globalName = globalObjectName(day);
    const global = await reserveAt(globalName, config.globalDailyCap, GLOBAL_LEDGER_KEY, nowSec, id);
    if (!global.ok) return { ok: false, reason: 'global', retryAfterSec: global.retryAfterSec };
    try {
      const network = await reserveAt(networkObjectName(key), config.rateLimitPerDay, key, nowSec, id);
      if (network.ok) return { ok: true, reservation: formatReservation(day, id, key) };
      await refundAt(globalName, id);
      return { ok: false, reason: 'rate', retryAfterSec: network.retryAfterSec };
    } catch (error) {
      await refundAt(globalName, id).catch(() => undefined);
      throw error;
    }
  }

  return {
    async reserve(networkKey, nowSec) {
      if (config.killSwitch) return KILL_SWITCH;
      try {
        return await reserveBoth(networkKey, nowSec);
      } catch {
        return MISCONFIG;
      }
    },
    async refund(reservation) {
      const parsed = parseReservation(reservation);
      if (parsed === null) return;
      const outcomes = await Promise.allSettled([
        refundAt(globalObjectName(parsed.day), parsed.id),
        refundAt(networkObjectName(parsed.networkKey), parsed.id),
      ]);
      if (outcomes.some((outcome) => outcome.status === 'rejected')) throw new Error('devolução da cota incompleta');
    },
  };
}
