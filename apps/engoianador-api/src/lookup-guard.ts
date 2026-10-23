/* eslint-disable functional/immutable-data -- o contador por rede é estado mutável local ao isolate */
import { LOOKUP_MAX_PER_WINDOW, LOOKUP_MAX_TRACKED_NETWORKS, LOOKUP_WINDOW_MS } from './lookup-guard.constants';
import type { LookupGuard, LookupGuardDecision } from './lookup-guard.types';

interface Window {
  readonly startedAtMs: number;
  readonly count: number;
}

const MS_PER_SEC = 1000;

// Vive só na memória do isolate: barato e sem KV, serve para segurar rajada antes de ler o cache.
export function createLookupGuard(): LookupGuard {
  const windows = new Map<string, Window>();

  function evictExpired(nowMs: number): void {
    for (const [key, window] of windows) {
      if (nowMs - window.startedAtMs >= LOOKUP_WINDOW_MS) windows.delete(key);
    }
    if (windows.size >= LOOKUP_MAX_TRACKED_NETWORKS) windows.clear();
  }

  return {
    check(networkKey, nowMs): LookupGuardDecision {
      const current = windows.get(networkKey);
      if (current === undefined || nowMs - current.startedAtMs >= LOOKUP_WINDOW_MS) {
        if (current === undefined && windows.size >= LOOKUP_MAX_TRACKED_NETWORKS) evictExpired(nowMs);
        windows.set(networkKey, { startedAtMs: nowMs, count: 1 });
        return { allowed: true, retryAfterSec: 0 };
      }
      if (current.count >= LOOKUP_MAX_PER_WINDOW) {
        const remainingMs = LOOKUP_WINDOW_MS - (nowMs - current.startedAtMs);
        return { allowed: false, retryAfterSec: Math.max(1, Math.ceil(remainingMs / MS_PER_SEC)) };
      }
      windows.set(networkKey, { startedAtMs: current.startedAtMs, count: current.count + 1 });
      return { allowed: true, retryAfterSec: 0 };
    },
  };
}
