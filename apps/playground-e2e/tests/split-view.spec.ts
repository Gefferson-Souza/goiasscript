import { expect, test } from '@playwright/test';
import { plainOutputLines, readGoldenStdout } from './support/golden.ts';
import { TEST_IDS } from '../../playground/lib/test-ids.constants.ts';
import { PlaygroundPage } from './support/playground-page.ts';

const FOLDABLE_PROGRAM = ['uai a é 2 mais 3', 'prosa(a)'].join('\n');
const DIDACTIC_CODE = 'const a = 2 + 3;';
const OPTIMIZED_CODE = 'console.log(5)';
const EXAMPLE_IDS = ['ola-mundo', 'lista-e-filtro', 'funcao-e-decisao', 'classe-pequi', 'tratando-erro'] as const;
const EXAMPLE_TITLES: Readonly<Record<(typeof EXAMPLE_IDS)[number], string>> = {
  'ola-mundo': 'Olá Mundo',
  'lista-e-filtro': 'Lista e filtro',
  'funcao-e-decisao': 'Função e decisão',
  'classe-pequi': 'Classe Pequi',
  'tratando-erro': 'Tratando erro',
};
const RUN_FINISHED = /Rodou bonito/u;

test.describe('Tela dividida', () => {
  test('mostra o JS gerado ao lado do editor e troca para o otimizado', async ({ page }) => {
    const playground = new PlaygroundPage(page);
    await playground.open();
    await playground.typeProgram(FOLDABLE_PROGRAM);

    await expect(page.getByTestId(TEST_IDS.generatedCode)).toContainText(DIDACTIC_CODE);

    await page.getByRole('radio', { name: 'Otimizado' }).click();
    await expect(page.getByRole('radio', { name: 'Otimizado' })).toBeChecked();
    await expect(page.getByTestId(TEST_IDS.generatedCode)).toContainText(OPTIMIZED_CODE);
    await expect(page.getByTestId(TEST_IDS.generatedCode)).not.toContainText(DIDACTIC_CODE);

    await page.getByRole('radio', { name: 'Didático' }).click();
    await expect(page.getByTestId(TEST_IDS.generatedCode)).toContainText(DIDACTIC_CODE);
  });

  for (const id of EXAMPLE_IDS) {
    test(`o exemplo ${EXAMPLE_TITLES[id]} roda e imprime o resultado esperado`, async ({ page }) => {
      const playground = new PlaygroundPage(page);
      await playground.open();

      await page.getByLabel('Exemplos:').selectOption({ label: EXAMPLE_TITLES[id] });
      await playground.run();

      await expect(page.getByRole('status').filter({ hasText: RUN_FINISHED })).toBeVisible();
      expect(plainOutputLines(await playground.output()).trim()).toBe(readGoldenStdout(id).trim());
    });
  }
});
