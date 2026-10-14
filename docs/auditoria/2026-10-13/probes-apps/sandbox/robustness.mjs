// Robustez do runtime do playground. Deve rodar DENTRO de um cgroup com MemoryMax (ver comando).
// Resultados são gravados de forma incremental (JSON lines) para sobreviver a um OOM-kill.
import { createRequire } from 'node:module';
import { appendFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require('<repo>/node_modules/.pnpm/playwright-core@1.60.0/node_modules/playwright-core');
const HEADLESS_SHELL = '<home>/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const BASE = 'http://127.0.0.1:3101';
const OUT = process.argv[2];
const WHICH = process.argv[3] || 'all';
writeFileSync(OUT, '');
const log = (o) => { appendFileSync(OUT, JSON.stringify(o) + '\n'); console.log(JSON.stringify(o)); };

const rssMB = () => {
  try {
    const rows = execSync('ps -e -o pid=,ppid=,rss=').toString().trim().split('\n').map((l) => l.trim().split(/\s+/).map(Number));
    const kids = new Map(); rows.forEach(([pid, ppid, rss]) => { (kids.get(ppid) || kids.set(ppid, []).get(ppid)).push([pid, rss]); });
    let total = 0; const stack = [process.pid];
    while (stack.length) { const cur = stack.pop(); for (const [pid, rss] of kids.get(cur) || []) { total += rss; stack.push(pid); } }
    return Math.round(total / 1024);
  } catch { return -1; }
};

async function open(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const events = [];
  page.on('crash', () => events.push('PAGE CRASH'));
  page.on('pageerror', (e) => events.push('pageerror: ' + String(e.message).slice(0, 120)));
  page.on('close', () => events.push('page closed'));
  await page.goto(BASE + '/');
  await page.locator('.monaco-editor').first().waitFor({ state: 'visible', timeout: 20000 });
  await page.waitForFunction(() => window.monaco && window.monaco.editor.getModels()[0].getValue().includes('Eai sô'));
  return { ctx, page, events };
}
async function setCode(page, code) { await page.evaluate((c) => window.monaco.editor.getModels()[0].setValue(c), code); }
async function installHeartbeat(page) {
  await page.evaluate(() => { window.__lag = []; let last = performance.now(); window.__hb = setInterval(() => { const n = performance.now(); window.__lag.push(Math.round(n - last)); last = n; }, 100); });
}

// ---------- F3: nested worker sobrevive ao terminate() do pai? ----------
async function f3() {
  const browser = await chromium.launch({ executablePath: HEADLESS_SHELL });
  const { ctx, page } = await open(browser);
  await page.evaluate(() => { window.__beats = 0; const bc = new BroadcastChannel('hb'); bc.onmessage = () => { window.__beats++; }; });
  const code = `const G = Function("return this")();
const src = 'const bc = new BroadcastChannel("hb"); setInterval(() => bc.postMessage(Date.now()), 100);';
const url = G.URL.createObjectURL(new G.Blob([src]));
new G.Worker(url);
console.log("nested worker criado");
while (true) {}`;
  await setCode(page, code);
  const t0 = Date.now();
  await page.getByRole('button', { name: /Bota pra moer/i }).click();
  await page.getByRole('status').filter({ hasText: /travou/ }).waitFor({ timeout: 15000 });
  const tTimeout = Date.now() - t0;
  const beatsAtTimeout = await page.evaluate(() => window.__beats);
  await page.waitForTimeout(2500);
  const beatsLater = await page.evaluate(() => window.__beats);
  log({ case: 'F3 nested worker (blob) criado pelo código do usuário; pai termina por timeout', tTimeoutMs: tTimeout, beatsAtTimeout, beatsAfter2500ms: beatsLater, survivedTerminate: beatsLater > beatsAtTimeout + 3 });
  await ctx.close(); await browser.close();
}

// ---------- F3b: o navegador termina nested workers quando o pai é terminado? (independe do produto) ----------
async function f3b() {
  const browser = await chromium.launch({ executablePath: HEADLESS_SHELL });
  const { ctx, page } = await open(browser);
  const r = await page.evaluate(async () => {
    const bc = new BroadcastChannel('hb2'); let beats = 0; bc.onmessage = () => { beats++; }; window.__bc = bc;
    const parentSrc = 'const src = \'const bc = new BroadcastChannel("hb2"); setInterval(() => bc.postMessage(1), 100);\'; new Worker(URL.createObjectURL(new Blob([src]))); setInterval(() => {}, 1000);';
    const w = new Worker(URL.createObjectURL(new Blob([parentSrc])));
    await new Promise((res) => setTimeout(res, 1200));
    const before = beats; w.terminate();
    await new Promise((res) => setTimeout(res, 300)); const atTerminate = beats;
    await new Promise((res) => setTimeout(res, 1500)); const after = beats;
    return { beatsWhileParentAlive: before, beatsRightAfterTerminate: atTerminate, beatsAfter1500ms: after };
  });
  log({ case: 'F3b nested worker + terminate() do pai (experimento direto no Chromium)', ...r, nestedDiedWithParent: r.beatsAfter1500ms <= r.beatsRightAfterTerminate + 1 });
  await ctx.close(); await browser.close();
}

// ---------- F1/F2: flood de logs ----------
async function flood(label, code, { waitMs = 60000 } = {}) {
  const browser = await chromium.launch({ executablePath: HEADLESS_SHELL });
  const { ctx, page, events } = await open(browser);
  await installHeartbeat(page);
  await setCode(page, code);
  const rssBefore = rssMB();
  const t0 = Date.now();
  let peak = rssBefore; const sampler = setInterval(() => { peak = Math.max(peak, rssMB()); }, 250);
  await page.getByRole('button', { name: /Bota pra moer/i }).click().catch((e) => events.push('click: ' + e.message.slice(0, 80)));
  let status = null; let tStatus = null;
  try {
    await page.getByRole('status').filter({ hasText: /Rodou bonito|Deu ruim|travou/ }).waitFor({ timeout: waitMs });
    tStatus = Date.now() - t0;
    status = (await page.getByRole('status').innerText()).trim();
  } catch (e) { events.push('status não apareceu em ' + waitMs + 'ms: ' + e.message.split('\n')[0].slice(0, 80)); }
  let rows = null; let maxLag = null; let tabSwitchMs = null;
  try {
    rows = await page.evaluate(() => document.querySelectorAll('[role="tabpanel"] .space-y-1 > div').length);
    maxLag = await page.evaluate(() => Math.max(0, ...window.__lag));
    const t1 = Date.now();
    await page.getByRole('tab', { name: 'JS gerado' }).click({ timeout: 30000 });
    tabSwitchMs = Date.now() - t1;
  } catch (e) { events.push('pós-run: ' + e.message.split('\n')[0].slice(0, 100)); }
  clearInterval(sampler);
  log({ case: label, status, tStatusMs: tStatus, renderedRows: rows, longestMainThreadStallMs: maxLag, tabSwitchMs, rssBeforeMB: rssBefore, rssPeakMB: peak, events });
  await ctx.close().catch(() => {}); await browser.close().catch(() => {});
}

// ---------- F2b: loop infinito com prosa, flood LIMITADO (worker é morto pela sonda após N ms; o timeout do produto renderiza o que chegou) ----------
async function f2b(killAfterMs) {
  const browser = await chromium.launch({ executablePath: HEADLESS_SHELL });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addInitScript(() => {
    const Orig = window.Worker;
    window.__logCount = 0;
    window.Worker = class extends Orig { constructor(...a) { super(...a); window.__w = this; this.addEventListener('message', (e) => { if (e.data && e.data.type === 'log') window.__logCount++; }); } };
  });
  const page = await ctx.newPage();
  const events = [];
  page.on('crash', () => events.push('PAGE CRASH'));
  await page.goto(BASE + '/');
  await page.locator('.monaco-editor').first().waitFor({ state: 'visible', timeout: 20000 });
  await page.waitForFunction(() => window.monaco && window.monaco.editor.getModels()[0].getValue().includes('Eai sô'));
  await installHeartbeat(page);
  await setCode(page, 'enquanto_tiver (certeza) { prosa("oi"); }');
  const t0 = Date.now();
  await page.getByRole('button', { name: /Bota pra moer/i }).click();
  await page.waitForTimeout(killAfterMs);
  const countAtKill = await page.evaluate(() => { const n = window.__logCount; window.__w.terminate(); return n; }).catch((e) => { events.push('evaluate: ' + e.message.slice(0, 80)); return null; });
  let peak = rssMB(); const sampler = setInterval(() => { peak = Math.max(peak, rssMB()); }, 250);
  let status = null; let tStatus = null;
  try { await page.getByRole('status').filter({ hasText: /travou|Rodou bonito|Deu ruim/ }).waitFor({ timeout: 120000 }); tStatus = Date.now() - t0; status = (await page.getByRole('status').innerText()).trim(); }
  catch (e) { events.push('status não apareceu em 120s: ' + e.message.split('\n')[0].slice(0, 80)); }
  let rows = null; let maxLag = null;
  try { rows = await page.evaluate(() => document.querySelectorAll('[role="tabpanel"] .space-y-1 > div').length); maxLag = await page.evaluate(() => Math.max(0, ...window.__lag)); } catch (e) { events.push('pós: ' + e.message.split('\n')[0].slice(0, 80)); }
  clearInterval(sampler);
  log({ case: `F2b loop infinito com prosa (worker morto pela sonda aos ${killAfterMs} ms)`, logsRecebidosAteMatar: countAtKill, logsPorSegundoNoMainThread: countAtKill ? Math.round(countAtKill / (killAfterMs / 1000)) : null, status, tStatusMs: tStatus, renderedRows: rows, longestMainThreadStallMs: maxLag, rssPeakMB: peak, events });
  await ctx.close().catch(() => {}); await browser.close().catch(() => {});
}

// ---------- F5: alocação de memória com heap V8 limitado (simula dispositivo modesto) ----------
async function memoryBomb() {
  const browser = await chromium.launch({ executablePath: HEADLESS_SHELL, args: ['--js-flags=--max-old-space-size=256'] });
  const { ctx, page, events } = await open(browser);
  await setCode(page, 'const a = []; while (true) { a.push(new Array(1000).fill(7)); }');
  const t0 = Date.now();
  await page.getByRole('button', { name: /Bota pra moer/i }).click().catch(() => {});
  let status = null;
  try { await page.getByRole('status').filter({ hasText: /Rodou bonito|Deu ruim|travou/ }).waitFor({ timeout: 15000 }); status = (await page.getByRole('status').innerText()).trim(); }
  catch (e) { events.push('status não apareceu: ' + e.message.split('\n')[0].slice(0, 80)); }
  let alive = true; try { await page.evaluate(() => 1, null); } catch { alive = false; }
  const editorKept = alive ? await page.evaluate(() => window.monaco.editor.getModels()[0].getValue().length > 0).catch(() => null) : null;
  log({ case: 'F5 alocação infinita (heap V8 limitado a 256 MB)', status, tMs: Date.now() - t0, pageAliveAfter: alive, editorKeptCode: editorKept, events });
  await ctx.close().catch(() => {}); await browser.close().catch(() => {});
}

if (WHICH === 'all' || WHICH === 'f3') await f3();
if (WHICH === 'all' || WHICH === 'f3b') await f3b();
if (WHICH === 'all' || WHICH === 'f1') await flood('F1 flood finito: 100.000 linhas de prosa e termina', 'vai_indo (trem i = 0; i menor_que 100000; i = i mais 1) { prosa("linha " mais i); }');
if (WHICH === 'all' || WHICH === 'f1b') await flood('F1b flood finito: 20.000 linhas', 'vai_indo (trem i = 0; i menor_que 20000; i = i mais 1) { prosa("linha " mais i); }');
if (WHICH === 'all' || WHICH === 'f2') await flood('F2 loop infinito COM prosa (erro de iniciante)', 'enquanto_tiver (certeza) { prosa("oi"); }', { waitMs: 90000 });
if (WHICH === 'f2b') await f2b(200);
if (WHICH === 'f2c') await f2b(500);
if (WHICH === 'all' || WHICH === 'f5') await memoryBomb();
log({ done: true });
