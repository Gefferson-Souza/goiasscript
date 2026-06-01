import { test, expect } from '@playwright/test';

test.describe('Página de doação', () => {
  test('mostra Pix, Sponsors e Ko-fi', async ({ page }) => {
    await page.goto('/doacao');
    const main = page.getByRole('main');
    await expect(page.getByRole('heading', { name: /Apoia o trem/i })).toBeVisible();
    await expect(main.getByText('goiasscript@proton.me')).toBeVisible();
    await expect(main.getByRole('link', { name: /Sponsors/i })).toBeVisible();
    await expect(main.getByRole('link', { name: /Ko-fi/i })).toBeVisible();
  });

  test('botão copiar Pix responde ao clique', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/doacao');
    await page
      .getByRole('main')
      .getByRole('button', { name: /Copiar/i })
      .click();
    await expect(page.getByRole('main').getByRole('button', { name: /Copiado/i })).toBeVisible();
  });
});
