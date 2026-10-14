// Probe: carregamento a frio (bytes transferidos via CDP), strings do Monaco (menu de contexto/busca).
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('<repo>/node_modules/.pnpm/playwright-core@1.60.0/node_modules/playwright-core');
const HEADLESS_SHELL = '<home>/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const BASE = 'http://127.0.0.1:3101';

const browser = await chromium.launch({ executablePath: HEADLESS_SHELL });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'pt-BR' });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Network.enable');
await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
const reqs = new Map();
let encodedTotal = 0;
cdp.on('Network.requestWillBeSent', (e) => reqs.set(e.requestId, { url: e.request.url, type: e.type }));
cdp.on('Network.loadingFinished', (e) => { const r = reqs.get(e.requestId); if (r) { r.bytes = e.encodedDataLength; encodedTotal += e.encodedDataLength; } });
// workers (Monaco) também geram requests; anexa nos targets filhos
await cdp.send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true }).catch(() => {});

const t0 = Date.now();
await page.goto(BASE + '/', { waitUntil: 'load' });
const tLoad = Date.now() - t0;
await page.locator('.monaco-editor').first().waitFor({ state: 'visible', timeout: 30000 });
const tMonaco = Date.now() - t0;
await page.waitForFunction(() => window.monaco && window.monaco.editor.getModels()[0].getValue().includes('Eai sô'));
const tAutoload = Date.now() - t0;
await page.waitForTimeout(800);

const list = [...reqs.values()].filter((r) => r.bytes != null).sort((a, b) => b.bytes - a.bytes);
console.log(JSON.stringify({ tLoadEventMs: tLoad, tMonacoVisibleMs: tMonaco, tAutoloadMs: tAutoload, requests: reqs.size, encodedTotalKB: Math.round(encodedTotal / 1024), top: list.slice(0, 8).map((r) => `${Math.round(r.bytes / 1024)} KB  ${r.url.replace(BASE, '')}`) }, null, 1));

// Strings do Monaco: menu de contexto e widget de busca
await page.locator('.monaco-editor .view-lines').first().click({ button: 'right', position: { x: 80, y: 40 } });
await page.waitForTimeout(400);
const menu = await page.locator('.monaco-menu').first().innerText().catch(() => '(sem menu)');
console.log('MENU DE CONTEXTO:', JSON.stringify(menu.split('\n').filter(Boolean).slice(0, 12)));
await page.keyboard.press('Escape');
await page.locator('.monaco-editor .view-lines').first().click();
await page.keyboard.press('Control+f');
await page.waitForTimeout(400);
const find = await page.evaluate(() => {
  const w = document.querySelector('.monaco-editor .find-widget');
  return w ? { placeholder: w.querySelector('textarea, input')?.getAttribute('placeholder'), ariaLabel: w.querySelector('textarea, input')?.getAttribute('aria-label'), titles: [...w.querySelectorAll('[title]')].map((e) => e.getAttribute('title')).slice(0, 6) } : null;
});
console.log('WIDGET DE BUSCA:', JSON.stringify(find));
const textboxLabel = await page.evaluate(() => document.querySelector('.monaco-editor textarea')?.getAttribute('aria-label'));
console.log('ARIA-LABEL DO EDITOR:', textboxLabel);
await browser.close();
