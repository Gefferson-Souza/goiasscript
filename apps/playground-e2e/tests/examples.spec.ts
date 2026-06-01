import { test, expect, type Page } from '@playwright/test';

// Carrega exemplos via o <select> (não depende de digitar no Monaco) e roda.
// Espera o conteúdo entrar no editor antes de rodar (o select faz fetch async).
async function carregarExemplo(page: Page, label: string, marcador: RegExp) {
  await page.goto('/');
  await expect(page.locator('.monaco-editor').first()).toBeVisible({ timeout: 15_000 });
  await page.getByLabel('Exemplos:').selectOption({ label });
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const m = (window as unknown as { monaco?: any }).monaco;
          return m?.editor?.getModels?.()[0]?.getValue?.() ?? '';
        }),
      { timeout: 15_000 }
    )
    .toMatch(marcador);
  await page.getByRole('button', { name: /Bota pra moer/i }).click();
  await expect(page.getByRole('status')).toContainText(/Rodou bonito/i, { timeout: 15_000 });
}

test.describe('Playground — exemplos transpilam e rodam', () => {
  test('Classe Pequi roda e imprime no painel de saída', async ({ page }) => {
    await carregarExemplo(page, 'Classe Pequi', /Pequi/);
    await expect(page.getByRole('tabpanel')).toContainText(/Pequi verde/i);
    await expect(page.getByRole('tabpanel')).toContainText(/amadureceu/i);
  });

  test('Lista e mapeamento imprime os dobrados', async ({ page }) => {
    await carregarExemplo(page, 'Lista e mapeamento', /mapear/);
    // O worker formata arrays com JSON pretty (multilinha); confere rótulo + valores.
    await expect(page.getByRole('tabpanel')).toContainText(/Dobrados/i);
    await expect(page.getByRole('tabpanel')).toContainText('10');
    await expect(page.getByRole('tabpanel')).toContainText(/Só os par/i);
  });

  test('aba "JS gerado" mostra o JavaScript transpilado', async ({ page }) => {
    await carregarExemplo(page, 'Olá Mundo', /saudacao/);
    await page.getByRole('tab', { name: 'JS gerado' }).click();
    await expect(page.getByRole('tabpanel')).toContainText(/console\.log/);
  });
});
