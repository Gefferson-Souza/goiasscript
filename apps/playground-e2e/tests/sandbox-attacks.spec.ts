import { expect, test } from '@playwright/test';
import { STATUS_LABELS } from '../../playground/components/ui-texts.constants.ts';
import { RUN_LIMITS } from '../../playground/config/run-limits.constants.ts';
import { ANY_FAILURE_LINE, failureLineIn, matchesAny } from './support/failure-line.ts';
import { HOSTILE_PROGRAMS } from './support/hostile-programs.ts';
import type { HostileProgram } from './support/hostile-programs.types.ts';
import { startCanaryServer } from './support/canary-server.ts';
import { HOST_SECRET_KEY, HOST_SECRET_VALUE } from './support/playground-page.constants.ts';
import { PlaygroundPage } from './support/playground-page.ts';

const ESCAPE_ATTACKS = HOSTILE_PROGRAMS.filter((attack) => attack.expect !== 'stopped-by-limit');
const ATTEMPT_MARKER = 'tentei';

function expectedPatterns(attack: HostileProgram): readonly RegExp[] {
  if (attack.failurePatterns === undefined) throw new Error(`Ataque sem mensagens esperadas: ${attack.name}`);
  return attack.failurePatterns;
}

test('o canário registra um acesso real, então canário vazio significa ataque contido', async ({ request }) => {
  const canary = await startCanaryServer();
  try {
    await request.get(`${canary.url}/controle`);
    expect(canary.hits()).toEqual(['GET /controle']);
  } finally {
    await canary.close();
  }
});

for (const attack of ESCAPE_ATTACKS) {
  test(`${attack.name} não alcança nada fora do Worker`, async ({ page }) => {
    const canary = await startCanaryServer();
    try {
      const playground = new PlaygroundPage(page);
      await playground.open({ canaryUrl: canary.url });
      await playground.typeProgram(attack.source(canary.url));
      await playground.run();

      if (attack.expect === 'compile-error') {
        await expect(playground.markers()).not.toHaveCount(0);
        await expect(playground.status()).toHaveText(STATUS_LABELS.failed);
        await expect(playground.streamLines('out')).toHaveCount(0);
        await expect(playground.streamLines('err')).toHaveCount(0);
      } else {
        // O JavaScriptCore demora mais a estourar a pilha; a espera cobre o limite de execução inteiro.
        await expect.poll(() => playground.output(), { timeout: RUN_LIMITS.maxRunMs }).toMatch(ANY_FAILURE_LINE);
        const output = await playground.output();
        expect(output).toContain(ATTEMPT_MARKER);
        expect(output.indexOf(ATTEMPT_MARKER)).toBeLessThan(output.search(ANY_FAILURE_LINE));
        expect(matchesAny(failureLineIn(output) ?? '', expectedPatterns(attack)), `linha de falha inesperada: ${failureLineIn(output) ?? ''}`).toBe(true);
        expect(output).not.toContain(HOST_SECRET_VALUE);
      }

      expect(canary.hits()).toEqual([]);
      expect(playground.canaryRequests()).toEqual([]);
      expect(await page.evaluate((key) => window.localStorage.getItem(key), HOST_SECRET_KEY)).toBe(HOST_SECRET_VALUE);
    } finally {
      await canary.close();
    }
  });
}
