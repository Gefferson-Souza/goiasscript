import { expect, test } from '@playwright/test';
import { ATTACK_IDS, HOST_SECRET, LINE_PROGRAM, LOOP_PROGRAM, buildAttackProgram } from '../src/attacks.mjs';
import { startServers } from '../src/server.mjs';

const CANDIDATES = ['worker-blob', 'worker-file', 'iframe-sandbox'];
const FREEZE_LIMIT_MS = 3000;
const RESPONSIVE_GAP_MS = 250;
const LOOP_OBSERVATION_MS = 600;
const EXPECTED_ERROR_LINE = 3;
const WAIT_TIMEOUT_MS = 10_000;

let servers;
test.beforeAll(async () => { servers = await startServers(); });
test.afterAll(async () => { await servers.close(); });

const finished = () => window.sandboxMessages.some((message) => message.type === 'done' || message.type === 'error');
const loopStarted = () => window.sandboxMessages.some((message) => message.type === 'loop-started');

async function openAndRun(page, candidate, code, until, query = '') {
  await page.goto(`${servers.hostUrl}/${candidate}.html${query}`);
  await page.evaluate((program) => window.start(program), code);
  await page.waitForFunction(until, null, { timeout: WAIT_TIMEOUT_MS });
}

const snapshot = (page) => page.evaluate(() => ({ messages: window.sandboxMessages, maxGap: window.heartbeat.maxGap }));

async function expectAttacksBlocked(page, candidate, query) {
  const before = servers.canaryHits().length;
  await openAndRun(page, candidate, buildAttackProgram(servers.canaryUrl), finished, query);
  const { messages } = await snapshot(page);
  const attacks = Object.fromEntries(messages.filter((message) => message.type === 'attack').map((message) => [message.id, message]));
  expect(Object.keys(attacks).sort()).toEqual([...ATTACK_IDS].sort());
  for (const id of ATTACK_IDS.filter((name) => name !== 'host-secrets')) expect(attacks[id].outcome, id).toBe('blocked');
  expect(attacks['host-secrets'].detail).not.toContain(HOST_SECRET);
  expect(servers.canaryHits().length - before).toBe(0);
}

for (const candidate of CANDIDATES) {
  test.describe(candidate, () => {
    test('nenhum ataque alcança o canário e nenhum segredo do host vaza', async ({ page }) => {
      await expectAttacksBlocked(page, candidate, '');
    });

    test('com a rede da página liberada, o isolamento não herda a CSP do host', async ({ page }) => {
      await expectAttacksBlocked(page, candidate, '?net=1');
    });

    test('o erro de execução aponta a linha exata do programa', async ({ page }) => {
      await openAndRun(page, candidate, LINE_PROGRAM, finished);
      const { messages } = await snapshot(page);
      const error = messages.find((message) => message.type === 'error');
      expect(error?.name).toBe('ReferenceError');
      const frame = /blob:\S*?:(\d+):(\d+)/.exec(error.stack);
      expect(Number(frame?.[1])).toBe(EXPECTED_ERROR_LINE);
    });

    test('laço infinito não congela a página e o encerramento funciona', async ({ page }) => {
      await openAndRun(page, candidate, LOOP_PROGRAM, loopStarted);
      await page.waitForTimeout(LOOP_OBSERVATION_MS);
      const outcome = await Promise.race([
        page.evaluate(() => { window.stop(); return window.heartbeat.maxGap; }),
        new Promise((resolve) => setTimeout(() => resolve('freeze'), FREEZE_LIMIT_MS)),
      ]);
      expect(outcome).not.toBe('freeze');
      expect(outcome).toBeLessThan(RESPONSIVE_GAP_MS);
    });
  });
}
