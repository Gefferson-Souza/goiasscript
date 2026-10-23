import { expect, test } from '@playwright/test';
import { STATUS_LABELS } from '../../playground/components/ui-texts.constants.ts';
import { RUN_LIMITS } from '../../playground/config/run-limits.constants.ts';
import { startHeartbeat } from './support/heartbeat.ts';
import { MAX_ACCEPTABLE_GAP_MS } from './support/heartbeat.constants.ts';
import { INFINITE_LOOP_PHRASE } from './support/expected-failures.constants.ts';
import { hostileSource, INFINITE_LOOP_LINE } from './support/hostile-programs.ts';
import { PlaygroundPage } from './support/playground-page.ts';

const RECURSIVE_TIMER_PROGRAM = [
  'trem passo é 0',
  'faz_trem repete() {',
  '  passo é passo mais 1',
  '  prosa("passo " mais passo)',
  '  daqui_um_cadim(repete, 100)',
  '}',
  'repete()',
].join('\n');

test.describe('limites de execução', () => {
  test('laço infinito para com aviso na linha certa e a aba segue responsiva', async ({ page }) => {
    const playground = new PlaygroundPage(page);
    await playground.open();
    const heartbeat = await startHeartbeat(page);
    await playground.typeProgram(hostileSource('laço infinito'));
    await heartbeat.reset();
    await playground.run();

    await expect(playground.status()).toHaveText(STATUS_LABELS.failed, { timeout: RUN_LIMITS.maxRunMs });
    expect(await playground.output()).toContain(INFINITE_LOOP_PHRASE(INFINITE_LOOP_LINE));
    expect(await heartbeat.sampleCount()).toBeGreaterThan(0);
    expect(await heartbeat.maxGapMs()).toBeLessThan(MAX_ACCEPTABLE_GAP_MS);
  });

  test('daqui_um_cadim em laço estoura o tempo máximo com aviso em goianês', async ({ page }) => {
    const playground = new PlaygroundPage(page);
    await playground.open();
    await playground.typeProgram(RECURSIVE_TIMER_PROGRAM);
    await playground.run();

    await expect(playground.status()).toHaveText(STATUS_LABELS.timeout, { timeout: RUN_LIMITS.maxRunMs * 2 });
    expect(await playground.output()).toContain('Esse trem travou, sô');
  });

  test('saída gigante é truncada com aviso e a página continua responsiva', async ({ page }) => {
    const playground = new PlaygroundPage(page);
    await playground.open();
    const heartbeat = await startHeartbeat(page);
    await playground.typeProgram(hostileSource('saída gigante'));
    await heartbeat.reset();
    await playground.run();

    await expect(playground.status()).toHaveText(STATUS_LABELS.finished, { timeout: RUN_LIMITS.maxRunMs });
    expect(await playground.output()).toContain('saiu linha demais');
    expect(await playground.streamLines('out').count()).toBe(RUN_LIMITS.maxLogLines);
    expect(await heartbeat.maxGapMs()).toBeLessThan(MAX_ACCEPTABLE_GAP_MS);
  });
});
