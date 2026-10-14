const path = require('path');
const core = process.argv[2];
const { GoiasScriptBrowserCompiler } = require(path.join(core, 'src/browser'));
const GoiasScriptCompiler = require(path.join(core, 'src/compiler'));
const c = new GoiasScriptBrowserCompiler();
const full = new GoiasScriptCompiler();
function t(label, fn) {
  const t0 = process.hrtime.bigint();
  let r;
  try { r = fn(); } catch (e) { r = 'LANCOU ' + e.name + ': ' + e.message; }
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  const shown = typeof r === 'string' ? r : JSON.stringify({ success: r && r.success, err: r && r.error && (r.error.message || r.error.tipo) });
  console.log(label.padEnd(58), ms.toFixed(1).padStart(9) + ' ms ', shown.slice(0, 120));
}
t('transpile(null)', () => c.transpile(null));
t('transpile(undefined)', () => c.transpile(undefined));
t('transpile(123)', () => c.transpile(123));
t('transpile({}) ', () => c.transpile({}));
t('compile(null) (compiler.js)', () => full.compile(null));
t('CRLF: "uai x é 1;\\r\\nprosa(x);"', () => c.transpile('uai x é 1;\r\nprosa(x);'));
t('BOM no inicio', () => c.transpile('﻿uai x é 1;'));
t('tabs', () => c.transpile('uai\tx\té\t1;'));
t('NFD (e + acento combinante) em "é"', () => c.transpile('uai x é 1;'));
t('200k chars sem aspas', () => c.transpile('uai x é 1;\n'.repeat(20000)));
t('100k aspas duplas nao fechadas', () => c.transpile('"'.repeat(100000)));
t('30k pares "a"a"a', () => c.transpile('"a'.repeat(30000)));
t('50k barras invertidas', () => c.transpile('"' + '\\'.repeat(50000)));
t('palavra-chave repetida 100k vezes', () => c.transpile('mais '.repeat(100000)));
t('aninhamento de parenteses 20k', () => c.transpile('('.repeat(20000) + ')'.repeat(20000)));
