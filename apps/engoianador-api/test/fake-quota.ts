import { QuotaLedgerObject } from '../src/rate-limiter.do';
import type { FakeNamespace, FakeNamespaceOptions } from './fake-quota.types';
import { createFakeSql } from './fake-sql';

/** Namespace de DO em memória: um QuotaLedgerObject real (com SQL falso) por nome. */
export function createFakeNamespace(options: FakeNamespaceOptions = {}): FakeNamespace {
  const objects = new Map<string, QuotaLedgerObject>();
  let fetches = 0;
  const namespace = {
    idFromName: (name: string) => ({ toString: () => name }),
    get: (id: { toString(): string }) => ({
      fetch: (input: string, init?: RequestInit) => {
        fetches += 1;
        if (options.failWith !== undefined) return Promise.reject(options.failWith);
        const name = id.toString();
        const known = objects.get(name);
        const object = known ?? new QuotaLedgerObject({ storage: { sql: createFakeSql() } } as unknown as DurableObjectState);
        objects.set(name, object);
        return object.fetch(new Request(input, init));
      },
    }),
  };
  return {
    namespace: namespace as unknown as DurableObjectNamespace,
    objectNames: () => [...objects.keys()],
    fetchCount: () => fetches,
  };
}
