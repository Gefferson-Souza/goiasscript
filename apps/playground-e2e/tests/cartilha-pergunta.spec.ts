import { expect, test } from '@playwright/test';
import { readModelMarkers } from './support/editor-api.ts';
import { PrimerPage } from './support/cartilha-page.ts';
import { LESSON_ELEVEN_EXPECTED_OUTPUT, LESSON_ELEVEN_SOLUTION } from './support/cartilha-page.constants.ts';

const LESSON_ELEVEN = 'licao-11';
const COMMA_WARNING_CODE = 'GS0805';

test.describe('cartilha — pergunta', () => {
  test('a lição 11 responde a pergunta com o stdin da lição e corrige', async ({ page }) => {
    const primer = new PrimerPage(page);
    await primer.openLesson(LESSON_ELEVEN);
    await primer.selectExercise();
    await primer.setProgram(LESSON_ELEVEN_SOLUTION);
    await primer.checkExercise();
    await expect(primer.verdict()).toHaveAttribute('data-verdict', 'correct', { timeout: primer.doneTimeoutMs() });
    await expect(primer.actualOutput()).toHaveText(LESSON_ELEVEN_EXPECTED_OUTPUT);
  });

  test('o aviso da vírgula aparece quando a resposta é 10,50 sem converter', async ({ page }) => {
    const primer = new PrimerPage(page);
    await primer.openLesson(LESSON_ELEVEN);
    await primer.selectExercise();
    await expect
      .poll(async () => (await readModelMarkers(page)).map(({ code }) => (typeof code === 'string' ? code : code?.value)))
      .toContain(COMMA_WARNING_CODE);
    await primer.checkExercise();
    await expect(primer.verdict()).toHaveAttribute('data-verdict', 'wrong', { timeout: primer.doneTimeoutMs() });
  });
});
