import { expect, test } from '@playwright/test';
import { STATUS_LABELS } from '../../playground/components/ui-texts.constants.ts';
import { readModelMarkers } from './support/editor-api.ts';
import { PrimerPage } from './support/cartilha-page.ts';

const LESSON_ONE = 'licao-01';
const LESSON_TWO = 'licao-02';
const COMMA_DECIMAL_PROGRAM = 'uai preço é 10,50';
const COMMA_DECIMAL_CODE = 'GS0208';
const WRONG_ANSWER = 'prosa("Oi")';

test.describe('cartilha — lição', () => {
  test('abre a lição 1, roda o exemplo e vê a saída', async ({ page }) => {
    const primer = new PrimerPage(page);
    await primer.openLesson(LESSON_ONE);
    await primer.runExample();
    await expect(page.getByRole('region', { name: 'Saída' }).getByRole('status')).toHaveText(STATUS_LABELS.finished);
    expect(await primer.output()).toContain('Bão, sô!');
  });

  test('erra e vê esperado e obtido', async ({ page }) => {
    const primer = new PrimerPage(page);
    await primer.openLesson(LESSON_ONE);
    await primer.selectExercise();
    await primer.setProgram(WRONG_ANSWER);
    await primer.checkExercise();
    await expect(primer.verdict()).toHaveAttribute('data-verdict', 'wrong');
    await expect(primer.expectedOutput()).toHaveText('Olá, Goiás!');
    await expect(primer.actualOutput()).toHaveText('Oi');
  });

  test('a lição 2 mostra o erro GS0208 no editor para uai preço é 10,50', async ({ page }) => {
    const primer = new PrimerPage(page);
    await primer.openLesson(LESSON_TWO);
    await primer.setProgram(COMMA_DECIMAL_PROGRAM);
    await expect
      .poll(async () => (await readModelMarkers(page)).map(({ code }) => (typeof code === 'string' ? code : code?.value)))
      .toContain(COMMA_DECIMAL_CODE);
  });
});
