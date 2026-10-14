'use strict';
const fs = require('fs');
const path = require('path');
const { probe } = require('./lib-probe');
const repo = '<repo>';
function listGs(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listGs(full)); else if (e.name.endsWith('.gs')) out.push(full);
  }
  return out;
}
const files = [...listGs(path.join(repo, 'packages/core/examples')), ...listGs(path.join(repo, 'packages/core/templates')), ...listGs(path.join(repo, 'packages/core/tests/fixtures'))];
const counts = {};
for (const f of files) {
  const r = probe(fs.readFileSync(f, 'utf8'));
  let status = !r.transpiled ? 'NAO_TRANSPILA' : r.syntaxOk === false ? 'SINTAXE_JS_INVALIDA' : r.runOk === false ? 'ERRO_EXECUCAO' : 'OK';
  counts[status] = (counts[status] || 0) + 1;
  console.log(`${status.padEnd(20)} ${path.relative(repo, f)}${r.error ? '  -> ' + r.error.slice(0, 110) : ''}`);
}
console.log('RESUMO', files.length, JSON.stringify(counts));
