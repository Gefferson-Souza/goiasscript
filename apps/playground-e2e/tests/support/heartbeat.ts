import type { Page } from '@playwright/test';
import { HEARTBEAT_INTERVAL_MS, HEARTBEAT_STATE_KEY } from './heartbeat.constants.ts';
import type { Heartbeat } from './heartbeat.types.ts';

// Um temporizador na thread principal da página: se o programa do aluno a travasse, haveria um intervalo enorme entre batidas.
export async function startHeartbeat(page: Page): Promise<Heartbeat> {
  await page.evaluate(
    ({ key, intervalMs }) => {
      const gaps: number[] = [];
      let last = performance.now();
      window.setInterval(() => {
        const now = performance.now();
        gaps.push(now - last);
        last = now;
      }, intervalMs);
      Reflect.set(window, key, gaps);
    },
    { key: HEARTBEAT_STATE_KEY, intervalMs: HEARTBEAT_INTERVAL_MS },
  );
  const readGaps = (): Promise<readonly number[]> => page.evaluate((key) => [...(Reflect.get(window, key) as number[])], HEARTBEAT_STATE_KEY);
  return {
    maxGapMs: async () => Math.max(0, ...(await readGaps())),
    sampleCount: async () => (await readGaps()).length,
  };
}
