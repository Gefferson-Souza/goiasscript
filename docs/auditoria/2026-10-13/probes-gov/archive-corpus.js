'use strict';
// Roda o corpus .gs arquivado (archive/v2-experimental) pelo transpiler 1.5 atual, sem checkout (git show).
const { execFileSync } = require('child_process');
const { probe } = require('./lib-probe');
const repo = '<repo>';
const ref = 'archive/v2-experimental';
const files = execFileSync('git', ['-C', repo, 'ls-tree', '-r', '--name-only', ref]).toString().split('\n').filter(f => f.endsWith('.gs'));
const buckets = {};
const rows = [];
let totalLines = 0;
for (const f of files) {
  const src = execFileSync('git', ['-C', repo, 'show', `${ref}:${f}`], { maxBuffer: 1 << 24 }).toString('utf8');
  const lines = src.split('\n').length;
  totalLines += lines;
  const r = probe(src);
  const status = !r.transpiled ? 'NAO_TRANSPILA' : r.syntaxOk === false ? 'SINTAXE_JS_INVALIDA' : r.runOk === false ? 'ERRO_EXECUCAO' : 'OK';
  const top = f.split('/').slice(0, 2).join('/');
  buckets[top] = buckets[top] || { n: 0, ok: 0, lines: 0 };
  buckets[top].n++;
  buckets[top].lines += lines;
  if (status === 'OK') buckets[top].ok++;
  rows.push({ f, lines, status });
}
console.log(`arquivos .gs no archive: ${files.length} | linhas: ${totalLines}`);
const counts = {};
for (const r of rows) counts[r.status] = (counts[r.status] || 0) + 1;
console.log('resultado no transpiler 1.5:', JSON.stringify(counts));
for (const [k, v] of Object.entries(buckets).sort((a, b) => b[1].lines - a[1].lines)) console.log(`  ${k.padEnd(40)} arquivos=${String(v.n).padStart(2)} linhas=${String(v.lines).padStart(5)} rodam_no_1.5=${v.ok}`);
