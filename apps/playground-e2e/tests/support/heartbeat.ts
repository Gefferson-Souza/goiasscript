import type { Page } from '@playwright/test';
import { HEARTBEAT_INTERVAL_MS, HEARTBEAT_STATE_KEY } from './heartbeat.constants.ts';
import type { Heartbeat } from './heartbeat.types.ts';

// Um temporizador na thread principal da página: se o programa do aluno a travasse, haveria um intervalo enorme entre batidas.
// O reset descarta o trabalho legítimo anterior (Monaco, painéis) para a janela medir só a execução.
export async function startHeartbeat(page: Page): Promise<Heartbeat> {
  await page.evaluate(
    ({ key, intervalMs }) => {
      const state = { gaps: [] as number[], last: performance.now() };
      window.setInterval(() => {
        const now = performance.now();
        state.gaps.push(now - state.last);
        state.last = now;
      }, intervalMs);
      Reflect.set(window, key, state);
    },
    { key: HEARTBEAT_STATE_KEY, intervalMs: HEARTBEAT_INTERVAL_MS },
  );
  const readGaps = (): Promise<readonly number[]> =>
    page.evaluate((key) => [...(Reflect.get(window, key) as { gaps: number[] }).gaps], HEARTBEAT_STATE_KEY);
  return {
    maxGapMs: async () => Math.max(0, ...(await readGaps())),
    sampleCount: async () => (await readGaps()).length,
    reset: () =>
      page.evaluate((key) => {
        const state = Reflect.get(window, key) as { gaps: number[]; last: number };
        state.gaps.length = 0;
        state.last = performance.now();
      }, HEARTBEAT_STATE_KEY),
  };
}
