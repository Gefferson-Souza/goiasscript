import { expect, test } from '@playwright/test';
import { STATUS_LABELS } from '../../playground/components/ui-texts.constants.ts';
import { HOSTILE_PROGRAMS } from './support/hostile-programs.ts';
import { startCanaryServer } from './support/canary-server.ts';
import { HOST_SECRET_KEY, HOST_SECRET_VALUE } from './support/playground-page.constants.ts';
import { PlaygroundPage } from './support/playground-page.ts';

const ESCAPE_ATTACKS = HOSTILE_PROGRAMS.filter((attack) => attack.expect !== 'stopped-by-limit');
const ATTEMPT_MARKER = 'tentei';
const FAILURE_LINE = /deu ruim: \S+/u;

for (const attack of ESCAPE_ATTACKS) {
  test(`${attack.name} não alcança nada fora do Worker`, async ({ page }) => {
    const canary = await startCanaryServer();
    try {
      const playground = new PlaygroundPage(page);
      await playground.open({ canaryUrl: canary.url });
      await playground.typeProgram(attack.source(canary.url));
      await playground.run();

      if (attack.expect === 'compile-error') {
        await expect(playground.markers().first()).toBeVisible();
        await expect(playground.status()).toHaveText(STATUS_LABELS.failed);
        expect(await playground.output()).not.toContain(ATTEMPT_MARKER);
      } else {
        await expect.poll(() => playground.output()).toMatch(FAILURE_LINE);
        const output = await playground.output();
        expect(output).toContain(ATTEMPT_MARKER);
        expect(output.indexOf(ATTEMPT_MARKER)).toBeLessThan(output.search(FAILURE_LINE));
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
