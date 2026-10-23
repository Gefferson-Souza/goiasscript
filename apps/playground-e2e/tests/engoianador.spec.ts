import { expect, test, type Request } from '@playwright/test';
import { REQUEST_TEXT_FIELD } from '../../playground/lib/engoianador-client.constants.ts';
import { CONFIGURED_PUBLIC_ENV } from '../playwright.constants.ts';
import { configuredServerOrigin, defaultServerOrigin } from './support/servers.ts';

const ENGOIANADOR_PATH = '/engoianador';
const NOT_FOUND_PATH = '/rota-que-nao-existe';
const IDLE_NOTICE = /tá de folga/u;
const PRESET_LABEL = 'Algoritmo de consenso';
const SUBMIT_LABEL = /Engoianar esse trem/u;
const INPUT_TEXT = 'Olá, isso é um teste.';
const NOT_FOUND_TITLE = /Cabôu o caminho/u;
const HOME_LINK = /Volta pro começo/u;
const NO_CONTENT = 204;

const isExternal = (request: Request, ownOrigin: string): boolean => {
  const { protocol, origin } = new URL(request.url());
  return (protocol === 'http:' || protocol === 'https:') && origin !== ownOrigin;
};

test.describe('Engoianador — sem URL configurada', () => {
  test('mostra que está de folga e não faz nenhuma requisição externa', async ({ page }) => {
    const external: string[] = [];
    page.on('request', (request) => {
      if (isExternal(request, defaultServerOrigin())) external.push(request.url());
    });

    await page.goto(ENGOIANADOR_PATH);

    await expect(page.getByRole('status').filter({ hasText: IDLE_NOTICE })).toBeVisible();
    await expect(page.locator('#entrada')).toHaveCount(0);
    await page.waitForLoadState('networkidle');
    expect(external).toEqual([]);
  });
});

test.describe('Engoianador — com URL configurada', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`${CONFIGURED_PUBLIC_ENV.NEXT_PUBLIC_ENGOIANADOR_URL}/**`, async (route) => {
      const corsHeaders = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' };
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: NO_CONTENT, headers: corsHeaders });
        return;
      }
      const body = route.request().postDataJSON() as Readonly<Record<string, string>>;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify({ engoianado: `Ô sô: ${body[REQUEST_TEXT_FIELD] ?? ''}` }),
      });
    });
  });

  test('clicar num exemplo pronto engoiana o texto', async ({ page }) => {
    await page.goto(`${configuredServerOrigin()}${ENGOIANADOR_PATH}`);

    await page.getByRole('button', { name: PRESET_LABEL }).click();

    await expect(page.locator('#saida')).toHaveValue(/Ô sô:/u);
  });

  test('engoiana o texto digitado', async ({ page }) => {
    await page.goto(`${configuredServerOrigin()}${ENGOIANADOR_PATH}`);

    await page.locator('#entrada').fill(INPUT_TEXT);
    await page.getByRole('button', { name: SUBMIT_LABEL }).click();

    await expect(page.locator('#saida')).toHaveValue(/Ô sô: Olá/u);
  });
});

test.describe('Página inexistente', () => {
  test('mostra o 404 em goianês com o caminho de volta', async ({ page }) => {
    const response = await page.goto(NOT_FOUND_PATH);

    expect(response?.status()).toBe(404);
    await expect(page.getByText(NOT_FOUND_TITLE)).toBeVisible();
    await expect(page.getByRole('link', { name: HOME_LINK })).toBeVisible();
  });
});
