import { expect, test } from '@playwright/test';
import { OG_CARD_SIZE } from '../../playground/lib/brand-card/brand-card.constants.ts';
import { HOME_TEXTS } from '../../playground/components/landing/home-texts.constants.ts';
import { HOME_ROUTE, PLAYGROUND_ROUTE } from '../../playground/lib/landing/routes.constants.ts';
import { SAVED_CODE_KEY } from '../../playground/lib/saved-code.constants.ts';
import { SHARE_HASH_PREFIX } from '../../playground/lib/share-link.constants.ts';
import { encodeShareLink } from '../../playground/lib/share-link.ts';

const OK_STATUS = 200;
const SHARED_SOURCE = 'prosa("link antigo")';
const SIDE_SELECTOR = '[data-side]';
const FLIPPED_SELECTOR = '[data-flipped="true"]';

test.describe('página inicial', () => {
  test('a vitrine vira pro JavaScript pelo teclado, mesmo sem animação', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(HOME_ROUTE);
    await expect(page.getByRole('heading', { level: 1, name: HOME_TEXTS.title })).toBeVisible();
    await expect(page.locator(SIDE_SELECTOR)).toHaveAttribute('data-side', 'dialect');

    await page.getByRole('button', { name: HOME_TEXTS.toJavaScript }).focus();
    await page.keyboard.press('Enter');

    await expect(page.locator(SIDE_SELECTOR)).toHaveAttribute('data-side', 'javascript');
    await expect(page.getByRole('button', { name: HOME_TEXTS.toDialect })).toBeFocused();
    await expect(page.locator(FLIPPED_SELECTOR).first()).toBeVisible();
  });

  test('o botão principal leva pro playground', async ({ page }) => {
    await page.goto(HOME_ROUTE);
    await page.getByRole('link', { name: HOME_TEXTS.openPlayground }).click();
    await expect(page).toHaveURL(new RegExp(`${PLAYGROUND_ROUTE}$`, 'u'));
  });

  test('link compartilhado antigo, apontando pro começo, abre o código no playground', async ({ page }) => {
    const payload = encodeShareLink(SHARED_SOURCE);
    expect(payload).not.toBeNull();
    await page.goto(`${HOME_ROUTE}${SHARE_HASH_PREFIX}${payload ?? ''}`);
    await expect(page).toHaveURL(new RegExp(`${PLAYGROUND_ROUTE}$`, 'u'));
    await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), SAVED_CODE_KEY)).toBe(SHARED_SOURCE);
  });

  test('a página aponta a imagem de compartilhamento e ela sai em PNG do tamanho do Open Graph', async ({ page, request }) => {
    await page.goto(HOME_ROUTE);
    const imageUrl = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(imageUrl).not.toBeNull();
    const response = await request.get(new URL(imageUrl ?? '', page.url()).pathname);
    expect(response.status()).toBe(OK_STATUS);
    expect(response.headers()['content-type']).toBe('image/png');
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', String(OG_CARD_SIZE.width));
  });
});

