import { z } from 'zod';
import { LEDGER_PATHS } from './quota/quota-ledger.constants';
import { createQuotaLedger } from './quota/quota-ledger';
import type { QuotaLedger } from './quota/quota.types';

const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_NOT_FOUND = 404;

const reserveSchema = z
  .object({
    key: z.string().min(1),
    limit: z.number().int().positive(),
    windowSec: z.number().int().positive(),
    nowSec: z.number().int().nonnegative(),
    id: z.string().min(1),
  })
  .strict();

const refundSchema = z.object({ id: z.string().min(1) }).strict();

function json(body: unknown, status = HTTP_OK): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export class QuotaLedgerObject {
  readonly #ledger: QuotaLedger;

  constructor(ctx: DurableObjectState) {
    this.#ledger = createQuotaLedger(ctx.storage.sql);
  }

  async fetch(request: Request): Promise<Response> {
    const { pathname } = new URL(request.url);
    // O corpo é lido antes de tocar no ledger: depois disso nada mais é assíncrono.
    const payload = await readJson(request);
    if (pathname === LEDGER_PATHS.reserve) {
      const parsed = reserveSchema.safeParse(payload);
      return parsed.success ? json(this.#ledger.reserve(parsed.data)) : json({ ok: false }, HTTP_BAD_REQUEST);
    }
    if (pathname === LEDGER_PATHS.refund) {
      const parsed = refundSchema.safeParse(payload);
      if (!parsed.success) return json({ ok: false }, HTTP_BAD_REQUEST);
      this.#ledger.refund(parsed.data.id);
      return json({ ok: true });
    }
    return json({ ok: false }, HTTP_NOT_FOUND);
  }
}
