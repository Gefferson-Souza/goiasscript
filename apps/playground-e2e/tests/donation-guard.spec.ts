import { expect, test } from '@playwright/test';
import { CONFIGURED_PUBLIC_ENV } from '../playwright.constants.ts';
import { configuredServerOrigin } from './support/servers.ts';

const DONATION_PATH = '/doacao';
const PIX_LABEL = /Pix/u;
const COPY_LABEL = /Copiar/u;
const COPIED_LABEL = /Copiado/u;
const COPY_OR_COPIED_LABEL = /Copiar|Copiado/u;
const FOOTER_PIX_BUTTON = /Pix/u;

test.describe('Doação — sem variáveis configuradas', () => {
  test('a página não mostra nenhum jeito de apoiar', async ({ page }) => {
    await page.goto(DONATION_PATH);

    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { name: /Apoia o trem/u })).toBeVisible();
    await expect(main.getByRole('button')).toHaveCount(0);
    await expect(main.getByRole('link')).toHaveCount(0);
    await expect(page.getByRole('contentinfo').getByRole('button', { name: FOOTER_PIX_BUTTON })).toHaveCount(0);
  });
});

test.describe('Doação — com variáveis configuradas', () => {
  test('a página mostra Pix, Sponsors e Ko-fi', async ({ page }) => {
    await page.goto(`${configuredServerOrigin()}${DONATION_PATH}`);

    const main = page.getByRole('main');
    await expect(main.getByText(CONFIGURED_PUBLIC_ENV.NEXT_PUBLIC_DONATION_PIX_KEY)).toBeVisible();
    await expect(main.getByRole('link', { name: /Sponsors/u })).toHaveAttribute('href', new URL(CONFIGURED_PUBLIC_ENV.NEXT_PUBLIC_DONATION_SPONSORS_URL).href);
    await expect(main.getByRole('link', { name: /Ko-fi/u })).toHaveAttribute('href', new URL(CONFIGURED_PUBLIC_ENV.NEXT_PUBLIC_DONATION_KOFI_URL).href);
    await expect(page.getByRole('contentinfo').getByRole('button', { name: PIX_LABEL })).toBeVisible();
  });

  test('o botão copiar responde ao clique', async ({ page, context, browserName }) => {
    // Só o Chromium conhece as permissões de área de transferência; nos outros o Playwright recusa a concessão.
    if (browserName === 'chromium') {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    }
    await page.goto(`${configuredServerOrigin()}${DONATION_PATH}`);

    await page.getByRole('main').getByRole('button', { name: COPY_LABEL }).click();

    // Sem permissão concedida o writeText pode falhar; o componente engole o erro e o botão segue de pé.
    const feedbackPattern = browserName === 'chromium' ? COPIED_LABEL : COPY_OR_COPIED_LABEL;
    await expect(page.getByRole('main').getByRole('button', { name: feedbackPattern })).toBeVisible();
  });
});
