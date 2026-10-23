'use client';
import { useEffect, useState } from 'react';
import { checkEngoianadorHealth } from '../../lib/engoianador-client.ts';
import type { EngoianadorHealth } from '../../lib/engoianador-client.types.ts';

/** Fica `up` até a checagem dizer o contrário, para a tela não piscar enquanto espera o /health. */
export function useEngoianadorHealth(engoianadorUrl: string): EngoianadorHealth {
  const [health, setHealth] = useState<EngoianadorHealth>('up');

  useEffect(() => {
    let cancelled = false;
    void checkEngoianadorHealth({ baseUrl: engoianadorUrl }).then((result) => {
      if (!cancelled) setHealth(result);
    });
    return () => {
      cancelled = true;
    };
  }, [engoianadorUrl]);

  return health;
}
