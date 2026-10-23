import { expect, test } from '@playwright/test';
import { PrimerPage } from './support/cartilha-page.ts';

const LESSON_ONE = 'licao-01';
const RIGHT_ANSWER = 'prosa("Olá, Goiás!")';

test.describe('cartilha — progresso', () => {
  test('acerta o exercício da lição 1 e a lição fica marcada no índice', async ({ page }) => {
    const primer = new PrimerPage(page);
    await primer.openLesson(LESSON_ONE);
    await primer.selectExercise();
    await primer.setProgram(RIGHT_ANSWER);
    await primer.checkExercise();
    await expect(primer.verdict()).toHaveAttribute('data-verdict', 'correct', { timeout: primer.doneTimeoutMs() });
    await primer.openIndex();
    await expect(primer.lessonLink(LESSON_ONE).getByTestId('lesson-done-badge')).toBeVisible();
    await expect(primer.doneBadges()).toHaveCount(1);
  });

  test('o progresso continua depois de recarregar a página', async ({ page }) => {
    const primer = new PrimerPage(page);
    await primer.openLesson(LESSON_ONE);
    await primer.selectExercise();
    await primer.setProgram(RIGHT_ANSWER);
    await primer.checkExercise();
    await expect(primer.verdict()).toHaveAttribute('data-verdict', 'correct', { timeout: primer.doneTimeoutMs() });
    await page.reload();
    await expect(primer.doneBadges()).toHaveCount(1);
  });

  test('sem localStorage a lição continua funcionando', async ({ page }) => {
    const primer = new PrimerPage(page);
    await primer.blockStorage();
    await primer.openLesson(LESSON_ONE);
    await primer.selectExercise();
    await primer.setProgram(RIGHT_ANSWER);
    await primer.checkExercise();
    await expect(primer.verdict()).toHaveAttribute('data-verdict', 'correct', { timeout: primer.doneTimeoutMs() });
    await expect(primer.doneBadges()).toHaveCount(1);
    await page.reload();
    await expect(primer.doneBadges()).toHaveCount(0);
  });
});
