// Probe web: screenshots, PNG de compartilhamento, a11y (aria snapshot), overflow mobile, contraste.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('<repo>/node_modules/.pnpm/playwright-core@1.60.0/node_modules/playwright-core');
const BASE = 'http://127.0.0.1:3101';
const OUT = process.argv[2];
const HEADLESS_SHELL = '<home>/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const browser = await chromium.launch({ executablePath: HEADLESS_SHELL });
const report = {};

const LONG = 'Ô sô, esse trem de algoritmo de consenso é um jeito de vários computador se entender e combinar o que é verdade, uai. Sem isso o sistema distribuído vira bagunça de mercado em dia de feira, e ninguém sabe quem tá certo. Bão demais ocê entender isso, fichinha! 🐂 Presta atenção que isso aqui é importante demais da conta, viu? Vê só como cada nó vota e a maioria decide, ô gente.';

async function monacoReady(page) {
  await page.locator('.monaco-editor').first().waitFor({ state: 'visible', timeout: 20000 });
  await page.waitForFunction(() => window.monaco && window.monaco.editor.getModels()[0].getValue().includes('Eai sô'), null, { timeout: 20000 });
}

// 1) Desktop: home depois de rodar
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/');
  await monacoReady(page);
  await page.getByRole('button', { name: /Bota pra moer/i }).click();
  await page.getByRole('status').filter({ hasText: /Rodou bonito/ }).waitFor();
  await page.screenshot({ path: OUT + '/shot-home-desktop.png' });
  report.homeAria = await page.locator('body').ariaSnapshot();
  report.homeOverflow = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
  await ctx.close();
}

// 2) Mobile: home
{
  const ctx = await browser.newContext({ ...devices['Pixel 5'] });
  const page = await ctx.newPage();
  await page.goto(BASE + '/');
  await monacoReady(page);
  await page.getByRole('button', { name: /Bota pra moer/i }).click();
  await page.getByRole('status').filter({ hasText: /Rodou bonito/ }).waitFor();
  await page.screenshot({ path: OUT + '/shot-home-mobile.png', fullPage: true });
  report.homeMobileOverflow = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
  await ctx.close();
}

// 3) Engoianador desktop + PNG de compartilhamento
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  await ctx.route('**/engoiana', (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ engoianado: LONG }) }));
  const popups = [];
  await ctx.route('https://twitter.com/**', (route) => { popups.push(route.request().url()); return route.fulfill({ status: 200, contentType: 'text/html', body: '<title>stub</title>' }); });
  const page = await ctx.newPage();
  await page.goto(BASE + '/engoianador');
  await page.getByRole('button', { name: 'Algoritmo de consenso' }).click();
  await page.locator('#saida').waitFor();
  await page.waitForFunction(() => document.querySelector('#saida').value.length > 10);
  await page.screenshot({ path: OUT + '/shot-engoianador-desktop.png' });
  report.engoianadorAria = await page.locator('body').ariaSnapshot();
  const t0 = Date.now();
  const [download] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }), page.getByRole('button', { name: /Compartilhar/ }).click()]);
  report.shareDownload = { suggested: download.suggestedFilename(), ms: Date.now() - t0 };
  await download.saveAs(OUT + '/share-card.png');
  await page.waitForTimeout(800);
  report.shareTwitterIntent = popups;
  report.engoianadorTextareaA11y = await page.evaluate(() => {
    const t = document.querySelector('#saida');
    return { tag: t.tagName, ariaLive: t.getAttribute('aria-live'), readOnly: t.readOnly };
  });
  // limite de entrada: colar 3000 chars
  await page.locator('#entrada').fill('x'.repeat(3000));
  report.entradaAposColar3000 = await page.evaluate(() => document.querySelector('#entrada').value.length);
  await ctx.close();
}

// 4) Doação desktop
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/doacao');
  await page.screenshot({ path: OUT + '/shot-doacao-desktop.png' });
  report.doacaoAria = await page.locator('body').ariaSnapshot();
  await ctx.close();
}

// 5) 404 e contraste dos textos "apagados"
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/naoexiste');
  report.notFoundText = (await page.locator('body').innerText()).slice(0, 200);
  await page.screenshot({ path: OUT + '/shot-404.png' });
  await ctx.close();
}

writeFileSync(OUT + '/web-probe.json', JSON.stringify(report, null, 2));
await browser.close();
console.log(JSON.stringify({ ...report, homeAria: undefined, engoianadorAria: undefined, doacaoAria: undefined }, null, 1));
