import { expect, test } from '@playwright/test';
import { readModelMarkers } from './support/editor-api.ts';
import { PlaygroundPage } from './support/playground-page.ts';

const THREE_ERRORS = ['uai a é 1', 'uai a é 2', 'prosa(naoexiste)', 'switch (1) { }'].join('\n');
const TWO_ERRORS = ['uai a é 1', 'prosa(naoexiste)', 'switch (1) { }'].join('\n');
const ONE_ERROR = ['uai a é 1', 'prosa(a)', 'switch (1) { }'].join('\n');
const CLEAN = ['uai a é 1', 'prosa(a)'].join('\n');

const UNDEFINED_NAME_PROGRAM = 'uai ação é nome_que_nao_existe';
// "uai ação é " ocupa 11 colunas; o nome inexistente tem 19 caracteres.
const UNDEFINED_NAME_START = 12;
const UNDEFINED_NAME_END = 31;

// O Monaco conta colunas em unidades UTF-16: ç NFC vale 1, ç NFD (c + cedilha) e o emoji valem 2.
const COLUMN_CASES = [
  { title: 'ç composto (NFC)', text: 'ç', startColumn: 22 },
  { title: 'ç decomposto (NFD)', text: 'ç', startColumn: 23 },
  { title: 'emoji', text: '\u{1F600}', startColumn: 23 },
] as const;
const UNDEFINED_NAME_LENGTH = 'naoexiste'.length;

test.describe('Editor — diagnósticos ao vivo', () => {
  test('mostra vários erros de uma vez e eles somem ao corrigir', async ({ page }) => {
    const playground = new PlaygroundPage(page);
    await playground.open();

    await playground.typeProgram(THREE_ERRORS);
    await expect.poll(async () => (await readModelMarkers(page)).length).toBe(3);
    await expect(playground.markers().first()).toBeVisible();

    await playground.typeProgram(TWO_ERRORS);
    await expect.poll(async () => (await readModelMarkers(page)).length).toBe(2);

    await playground.typeProgram(ONE_ERROR);
    await expect.poll(async () => (await readModelMarkers(page)).length).toBe(1);

    await playground.typeProgram(CLEAN);
    await expect.poll(async () => (await readModelMarkers(page)).length).toBe(0);
    await expect(playground.markers()).toHaveCount(0);
  });

  test('sublinha o nome inexistente na coluna certa', async ({ page }) => {
    const playground = new PlaygroundPage(page);
    await playground.open();

    await playground.typeProgram(UNDEFINED_NAME_PROGRAM);

    // Esperar só a contagem aceitaria o marcador do exemplo carregado, que no WebKit ainda está lá.
    await expect
      .poll(async () => (await readModelMarkers(page)).map(({ startLineNumber, startColumn, endColumn }) => ({ startLineNumber, startColumn, endColumn })))
      .toEqual([{ startLineNumber: 1, startColumn: UNDEFINED_NAME_START, endColumn: UNDEFINED_NAME_END }]);
  });

  for (const { title, text, startColumn } of COLUMN_CASES) {
    test(`mantém a coluna certa depois de ${title}`, async ({ page }) => {
      const playground = new PlaygroundPage(page);
      await playground.open();

      await playground.typeProgram(`uai texto é "${text}" mais naoexiste`);
      await expect.poll(async () => (await readModelMarkers(page)).length).toBe(1);

      const [marker] = await readModelMarkers(page);
      expect(marker?.startColumn).toBe(startColumn);
      expect(marker?.endColumn).toBe(startColumn + UNDEFINED_NAME_LENGTH);
    });
  }
});
