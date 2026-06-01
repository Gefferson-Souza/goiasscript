import { test, expect } from '@playwright/test';

test.describe('Playground — home', () => {
  test('carrega com editor, toolbar e abas de saída', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /Bota pra moer/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Limpa o terreiro/i })).toBeVisible();
    await expect(page.getByLabel('Exemplos:')).toBeVisible();
    // Abas com semântica acessível
    await expect(page.getByRole('tab', { name: 'Saída' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'JS gerado' })).toBeVisible();
    // Monaco montou
    await expect(page.locator('.monaco-editor').first()).toBeVisible({ timeout: 15_000 });
  });

  test('tem links de navegação e doação no rodapé', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Engoianador' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Apoia o trem' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Pix/i })).toBeVisible();
  });
});
