// Probe 3: (1) tokenização real do Monaco; (2) hipótese do flag unicode; (3) saída assíncrona; (4) STARTER;
// (5) diff entre keywords realçadas e tabela do transpilador; (6) o preâmbulo do JS gerado contém console.log?
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('<repo>/node_modules/.pnpm/playwright-core@1.60.0/node_modules/playwright-core');
const REPO = '<repo>';
const BASE = 'http://127.0.0.1:3101';
const HEADLESS_SHELL = '<home>/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const OUT = process.argv[2];
const report = {};

// ---------- (5) keywords do Monarch × tabela do transpilador (estático) ----------
const monarchSrc = readFileSync(`${REPO}/apps/playground/lib/monaco-goias.ts`, 'utf8');
const grab = (name) => {
  const m = monarchSrc.match(new RegExp(`${name}:\\s*\\[([\\s\\S]*?)\\]`));
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
};
const monarch = { keywords: grab('keywords'), storage: grab('storage'), constants: grab('constants'), types: grab('types'), operators: grab('operators'), builtins: grab('builtins') };
const trSrc = readFileSync(`${REPO}/packages/core/src/compiler/simpleTranspiler.js`, 'utf8');
const tableStart = trSrc.indexOf("['vai_na_frente_faz_trem'");
const tableChunk = trSrc.slice(trSrc.lastIndexOf('[', tableStart - 200), tableStart + 6000);
const mapped = new Map();
for (const m of tableChunk.matchAll(/\[\s*'([^']+)'\s*,\s*'([^']*)'\s*\]/g)) mapped.set(m[1], m[2]);
const runtimeMethods = (() => {
  const { GoiasScriptBrowserCompiler } = require(`${REPO}/packages/core/src/browser.js`);
  const r = new GoiasScriptBrowserCompiler().transpile('prosa("x")');
  return r.code;
})();
const allMonarch = [...new Set(Object.values(monarch).flat())];
const monarchNotTranspiled = allMonarch.filter((w) => !mapped.has(w) && !new RegExp(`\\b${w.replace(/[$]/g, '\\$')}\\b`).test(runtimeMethods));
const mappedNotHighlighted = [...mapped.keys()].filter((w) => !allMonarch.includes(w));
report.monarchVsTranspiler = { monarchTotal: allMonarch.length, mappedTotal: mapped.size, monarchNotTranspiled, mappedNotHighlighted };
report.preamble = (() => {
  const lines = runtimeMethods.split('\n');
  const idx = lines.findIndex((l) => /prosa\("x"\)|console\.log\("x"\)/.test(l));
  const pre = lines.slice(0, idx).join('\n');
  return { totalLines: lines.length, userCodeStartsAtLine: idx + 1, preambleConsoleLogCount: (pre.match(/console\.log/g) || []).length };
})();

// ---------- browser ----------
const browser = await chromium.launch({ executablePath: HEADLESS_SHELL });

async function open(opts = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  if (opts.blockExample) await context.route('**/examples/ola-mundo.gs', (r) => r.fulfill({ status: 404, body: 'nope' }));
  await page.goto(BASE + '/');
  await page.locator('.monaco-editor').first().waitFor({ state: 'visible', timeout: 20000 });
  await page.waitForFunction(() => window.monaco && window.monaco.editor.getModels().length > 0);
  if (!opts.blockExample) await page.waitForFunction(() => window.monaco.editor.getModels()[0].getValue().includes('Eai sô'));
  return { context, page };
}

// (1) tokenização
{
  const { context, page } = await open();
  const sample = 'uai x é 5;\nprosa(x mais 1);\nse_ocê_quiser (certeza e_mais x maior_que 3) {\n  faz_trem soma(a, b) { faz_favor a mais b; }\n}\n// comentário\nuai s é "texto";';
  report.tokens = await page.evaluate((code) => {
    const m = window.monaco;
    const model = m.editor.getModels()[0];
    const lang = model.getLanguageId();
    const lines = code.split('\n');
    const tk = m.editor.tokenize(code, 'goiasscript');
    const byType = {};
    const detail = tk.map((toks, i) => toks.map((t, j) => {
      const end = j + 1 < toks.length ? toks[j + 1].offset : lines[i].length;
      const text = lines[i].slice(t.offset, end);
      byType[t.type] = (byType[t.type] || 0) + 1;
      return `${JSON.stringify(text)}:${t.type || '(vazio)'}`;
    }).join(' '));
    return { languageId: lang, byType, detail };
  }, sample);

  // (2) hipótese: flag unicode ausente na definição Monarch
  const defText = (() => {
    const start = monarchSrc.indexOf('export const goiasMonarchLanguage = {');
    const end = monarchSrc.indexOf('export const goiasLanguageConfig');
    return monarchSrc.slice(start + 'export const goiasMonarchLanguage = '.length, end).trim().replace(/;\s*$/, '');
  })();
  report.tokensUnicodeFix = await page.evaluate(({ code, defText }) => {
    const m = window.monaco;
    const def = new Function('return ' + defText)();
    m.languages.register({ id: 'gs-probe-unicode' });
    m.languages.setMonarchTokensProvider('gs-probe-unicode', { ...def, unicode: true });
    const lines = code.split('\n');
    const tk = m.editor.tokenize(code, 'gs-probe-unicode');
    const byType = {};
    const detail = tk.map((toks, i) => toks.map((t, j) => {
      const end = j + 1 < toks.length ? toks[j + 1].offset : lines[i].length;
      byType[t.type] = (byType[t.type] || 0) + 1;
      return `${JSON.stringify(lines[i].slice(t.offset, end))}:${t.type || '(vazio)'}`;
    }).join(' '));
    // controle: mesma definição SEM unicode
    m.languages.register({ id: 'gs-probe-nounicode' });
    m.languages.setMonarchTokensProvider('gs-probe-nounicode', { ...def });
    const tk2 = m.editor.tokenize(code, 'gs-probe-nounicode');
    const byType2 = {};
    tk2.forEach((toks) => toks.forEach((t) => { byType2[t.type] = (byType2[t.type] || 0) + 1; }));
    return { withUnicodeTrue: { byType, detail }, withoutUnicode_control: { byType: byType2 } };
  }, { code: sample, defText });
  await page.screenshot({ path: OUT + '/shot-editor-highlight.png', clip: { x: 0, y: 110, width: 640, height: 200 } });
  await context.close();
}

// (3) saída assíncrona
async function runCode(page, code) {
  await page.evaluate((c) => window.monaco.editor.getModels()[0].setValue(c), code);
  await page.getByRole('button', { name: /Bota pra moer/i }).click();
  await page.getByRole('status').filter({ hasText: /Rodou bonito|Deu ruim|travou/ }).waitFor({ timeout: 10000 });
  const status = (await page.getByRole('status').innerText()).trim();
  const saida = (await page.getByRole('tabpanel').innerText()).trim();
  await page.waitForTimeout(1500);
  const saidaDepois = (await page.getByRole('tabpanel').innerText()).trim();
  return { status, saida, saidaApos1500ms: saidaDepois };
}
report.async = {};
{
  const { context, page } = await open();
  report.async.depois_de = await runCode(page, 'depois_de(100, faz_trem() { prosa("passou 100ms"); });\nprosa("agora");');
  report.async.promise_then = await runCode(page, 'Promise.resolve().then(() => prosa("microtask"));\nprosa("sync");');
  report.async.async_await = await runCode(page, 'vai_na_frente faz_trem f() { espera_um_cadim promessa.resolve(1); prosa("depois do await"); }\nf();\nprosa("sync");');
  report.async.async_so_com_await = await runCode(page, 'vai_na_frente faz_trem f() { espera_um_cadim promessa.resolve(1); prosa("depois do await"); }\nf();');
  report.async.erro_assincrono = await runCode(page, 'depois_de(10, faz_trem() { vixe_isso_nao_existe(); });\nprosa("agendado");');
  await context.close();
}

// (4) STARTER (quando o autoload falha)
{
  const { context, page } = await open({ blockExample: true });
  const starter = await page.evaluate(() => window.monaco.editor.getModels()[0].getValue());
  const r = await runCode(page, starter);
  report.starter = { startsWith: starter.slice(0, 60), ...r };
  await context.close();
}

writeFileSync(OUT + '/probe3.json', JSON.stringify(report, null, 2));
await browser.close();
console.log(JSON.stringify(report, null, 1));
