'use client';
import { useCallback, useEffect, useState } from 'react';
import { checkEngoianadorHealth } from '../../lib/engoianador-client.ts';
import type { EngoianadorHealth } from '../../lib/engoianador-client.types.ts';
import type { EngoianadorHealthState } from './engoianador-health.types.ts';
import { readCachedHealth, storeHealth } from './health-cache.ts';

/** Fica `up` até a checagem dizer o contrário, para a tela não piscar enquanto espera o /health. */
export function useEngoianadorHealth(engoianadorUrl: string): EngoianadorHealthState {
  const [health, setHealth] = useState<EngoianadorHealth>('up');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const cached = attempt === 0 ? readCachedHealth(engoianadorUrl, Date.now()) : null;
    if (cached !== null) {
      setHealth(cached);
      return undefined;
    }
    let cancelled = false;
    void checkEngoianadorHealth({ baseUrl: engoianadorUrl }).then((result) => {
      storeHealth(engoianadorUrl, result, Date.now());
      if (!cancelled) setHealth(result);
    });
    return () => {
      cancelled = true;
    };
  }, [engoianadorUrl, attempt]);

  const recheck = useCallback(() => {
    setAttempt((previous) => previous + 1);
  }, []);

  return { health, recheck };
}
