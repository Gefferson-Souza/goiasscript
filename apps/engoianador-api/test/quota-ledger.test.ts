import { describe, expect, it } from 'vitest';
import { createQuotaLedger } from '../src/quota/quota-ledger';
import { SECONDS_PER_DAY } from '../src/quota/quota-ledger.constants';
import { QuotaLedgerObject } from '../src/rate-limiter.do';
import { createFakeSql } from './fake-sql';

const NOW = 1_800_000_000;
const LIMIT = 20;

function reserveInput(id: string, overrides: { readonly limit?: number; readonly nowSec?: number } = {}) {
  return { key: 'net:a', limit: overrides.limit ?? LIMIT, windowSec: SECONDS_PER_DAY, nowSec: overrides.nowSec ?? NOW, id };
}

describe('QuotaLedger', () => {
  it('concede exatamente o limite sob 30 chamadas simultâneas', async () => {
    const ledger = createQuotaLedger(createFakeSql());
    const decisions = await Promise.all(Array.from({ length: 30 }, (_, index) => Promise.resolve().then(() => ledger.reserve(reserveInput(`r${String(index)}`)))));
    expect(decisions.filter((decision) => decision.ok)).toHaveLength(LIMIT);
    expect(decisions.filter((decision) => !decision.ok)).toHaveLength(10);
  });

  it('concede exatamente o limite sob 30 requisições simultâneas ao objeto', async () => {
    const object = new QuotaLedgerObject({ storage: { sql: createFakeSql() } } as unknown as DurableObjectState);
    const calls = Array.from({ length: 30 }, (_, index) =>
      object.fetch(new Request('https://quota/reserve', { method: 'POST', body: JSON.stringify(reserveInput(`r${String(index)}`)) })),
    );
    const bodies = await Promise.all((await Promise.all(calls)).map((response) => response.json<{ ok: boolean }>()));
    expect(bodies.filter((body) => body.ok)).toHaveLength(LIMIT);
  });

  it('informa quanto falta para a virada do dia UTC ao negar', () => {
    const ledger = createQuotaLedger(createFakeSql());
    const dayStart = Math.floor(NOW / SECONDS_PER_DAY) * SECONDS_PER_DAY;
    const now = dayStart + 100;
    ledger.reserve(reserveInput('a', { limit: 1, nowSec: now }));
    const denied = ledger.reserve(reserveInput('b', { limit: 1, nowSec: now }));
    expect(denied).toEqual({ ok: false, retryAfterSec: SECONDS_PER_DAY - 100 });
  });

  it('refund devolve a cota uma única vez', () => {
    const ledger = createQuotaLedger(createFakeSql());
    ledger.reserve(reserveInput('a', { limit: 2 }));
    ledger.reserve(reserveInput('b', { limit: 2 }));
    expect(ledger.reserve(reserveInput('c', { limit: 2 })).ok).toBe(false);
    ledger.refund('a');
    ledger.refund('a');
    expect(ledger.reserve(reserveInput('d', { limit: 2 })).ok).toBe(true);
    expect(ledger.reserve(reserveInput('e', { limit: 2 })).ok).toBe(false);
  });

  it('refund de reserva desconhecida não mexe no contador', () => {
    const ledger = createQuotaLedger(createFakeSql());
    ledger.reserve(reserveInput('a', { limit: 1 }));
    ledger.refund('nunca-existiu');
    expect(ledger.reserve(reserveInput('b', { limit: 1 })).ok).toBe(false);
  });

  it('repetir a mesma reserva não consome duas vezes', () => {
    const ledger = createQuotaLedger(createFakeSql());
    expect(ledger.reserve(reserveInput('a', { limit: 1 })).ok).toBe(true);
    expect(ledger.reserve(reserveInput('a', { limit: 1 })).ok).toBe(true);
    expect(ledger.reserve(reserveInput('b', { limit: 1 })).ok).toBe(false);
  });

  it('a janela vira à meia-noite UTC', () => {
    const ledger = createQuotaLedger(createFakeSql());
    const dayStart = Math.floor(NOW / SECONDS_PER_DAY) * SECONDS_PER_DAY;
    expect(ledger.reserve(reserveInput('a', { limit: 1, nowSec: dayStart + SECONDS_PER_DAY - 1 })).ok).toBe(true);
    expect(ledger.reserve(reserveInput('b', { limit: 1, nowSec: dayStart + SECONDS_PER_DAY - 1 })).ok).toBe(false);
    expect(ledger.reserve(reserveInput('c', { limit: 1, nowSec: dayStart + SECONDS_PER_DAY })).ok).toBe(true);
  });

  it('a janela expira depois de 24 h', () => {
    const ledger = createQuotaLedger(createFakeSql());
    ledger.reserve(reserveInput('a', { limit: 1 }));
    expect(ledger.reserve(reserveInput('b', { limit: 1, nowSec: NOW + SECONDS_PER_DAY })).ok).toBe(true);
  });

  it('o teto global nega depois do limite', () => {
    const ledger = createQuotaLedger(createFakeSql());
    const cap = 3;
    const outcomes = Array.from({ length: 5 }, (_, index) => ledger.reserve({ ...reserveInput(`g${String(index)}`), key: 'global', limit: cap }).ok);
    expect(outcomes).toEqual([true, true, true, false, false]);
  });
});

describe('QuotaLedgerObject', () => {
  it('recusa corpo malformado com 400', async () => {
    const object = new QuotaLedgerObject({ storage: { sql: createFakeSql() } } as unknown as DurableObjectState);
    const response = await object.fetch(new Request('https://quota/reserve', { method: 'POST', body: '{"nada":1}' }));
    expect(response.status).toBe(400);
  });

  it('devolve 404 para rota desconhecida', async () => {
    const object = new QuotaLedgerObject({ storage: { sql: createFakeSql() } } as unknown as DurableObjectState);
    const response = await object.fetch(new Request('https://quota/outra', { method: 'POST', body: '{}' }));
    expect(response.status).toBe(404);
  });

  it('refund pela rota devolve a cota', async () => {
    const object = new QuotaLedgerObject({ storage: { sql: createFakeSql() } } as unknown as DurableObjectState);
    const post = (path: string, body: unknown) => object.fetch(new Request(`https://quota/${path}`, { method: 'POST', body: JSON.stringify(body) }));
    await post('reserve', reserveInput('a', { limit: 1 }));
    expect((await (await post('reserve', reserveInput('b', { limit: 1 }))).json<{ ok: boolean }>()).ok).toBe(false);
    expect((await post('refund', { id: 'a' })).status).toBe(200);
    expect((await (await post('reserve', reserveInput('c', { limit: 1 }))).json<{ ok: boolean }>()).ok).toBe(true);
  });
});
