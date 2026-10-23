import { expect, test, type Locator, type Page } from '@playwright/test';
import { PlaygroundPage } from './support/playground-page.ts';

const SUGGEST_LIST = '[role="listbox"]';
const FOCUSED_ROW = '.monaco-list-row.focused';
const HOVER_WIDGET = '.monaco-hover';
const TOKEN_SELECTOR = '.monaco-editor .view-line span';
const MAX_ARROW_PRESSES = 30;

async function openSuggestions(page: Page, typed: string): Promise<void> {
  const playground = new PlaygroundPage(page);
  await playground.open();
  await playground.typeProgram(typed);
  await page.keyboard.press('Control+Space');
  await expect(page.locator(SUGGEST_LIST).first()).toBeVisible();
}

// A lista é virtualizada e só a linha com foco mostra o equivalente em JS ao lado do nome.
async function focusSuggestion(page: Page, rowLabel: RegExp): Promise<Locator> {
  const focused = page.locator(FOCUSED_ROW);
  for (let presses = 0; presses < MAX_ARROW_PRESSES; presses += 1) {
    const label = await focused.getAttribute('aria-label');
    if (label !== null && rowLabel.test(label)) return focused;
    await page.keyboard.press('ArrowDown');
  }
  throw new Error(`Sugestão não encontrada: ${String(rowLabel)}`);
}

test.describe('Editor — autocomplete e hover', () => {
  test('se_ oferece se_ocê_quiser com o equivalente if', async ({ page }) => {
    await openSuggestions(page, 'se_');

    const row = await focusSuggestion(page, /^se_ocê_quiser, Keyword/u);

    await expect(row).toContainText('if');
  });

  test('se_ também oferece a variante sem acento', async ({ page }) => {
    await openSuggestions(page, 'se_');

    const row = await focusSuggestion(page, /^se_oce_quiser, Keyword/u);

    await expect(row).toContainText('if');
  });

  test('se_ oferece o trecho de se_ocê_quiser identificado como trecho', async ({ page }) => {
    await openSuggestions(page, 'se_');

    await focusSuggestion(page, /^se_ocê_quiser, Snippet/u);
  });

  test('prosa mostra o equivalente console.log', async ({ page }) => {
    await openSuggestions(page, 'prosa');

    const row = await focusSuggestion(page, /^prosa, Function/u);

    await expect(row).toContainText('console.log');
  });

  test('hover em uai mostra const', async ({ page }) => {
    const playground = new PlaygroundPage(page);
    await playground.open();
    await playground.typeProgram('uai nome é "Goiás"');

    await page.locator(TOKEN_SELECTOR).filter({ hasText: /^uai$/u }).first().hover();

    await expect(page.locator(HOVER_WIDGET).first()).toContainText('const');
  });
});
