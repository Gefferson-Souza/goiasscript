import { test, expect } from '@playwright/test';

// Intercepta a API do engoianador pra testar a UI sem depender do Worker real.
test.beforeEach(async ({ page }) => {
  await page.route('**/engoiana', async route => {
    const body = route.request().postDataJSON() as { texto?: string };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ engoianado: `Ô sô: ${body?.texto ?? ''}`.slice(0, 80) }),
    });
  });
});

test.describe('Engoianador — UI', () => {
  test('clicar num exemplo pré-pronto já engoiana', async ({ page }) => {
    await page.goto('/engoianador');
    await page.getByRole('button', { name: 'Algoritmo de consenso' }).click();
    await expect(page.locator('#saida')).toHaveValue(/Ô sô:/, { timeout: 15_000 });
    // Botões de copiar e compartilhar habilitam após ter saída
    await expect(page.getByRole('button', { name: /Compartilhar/i })).toBeEnabled();
  });

  test('engoianar texto digitado', async ({ page }) => {
    await page.goto('/engoianador');
    await page.locator('#entrada').fill('Olá, isso é um teste.');
    await page.getByRole('button', { name: /Engoianar esse trem/i }).click();
    await expect(page.locator('#saida')).toHaveValue(/Ô sô: Olá/, { timeout: 15_000 });
  });

  test('mostra erro amigável quando a API falha', async ({ page }) => {
    await page.unroute('**/engoiana');
    await page.route('**/engoiana', route =>
      route.fulfill({ status: 503, contentType: 'application/json', body: '{"erro":"de recesso"}' })
    );
    await page.goto('/engoianador');
    await page.locator('#entrada').fill('teste de erro');
    await page.getByRole('button', { name: /Engoianar esse trem/i }).click();
    await expect(page.getByRole('main').getByRole('alert')).toContainText(/Deu ruim/i, {
      timeout: 15_000,
    });
  });
});
