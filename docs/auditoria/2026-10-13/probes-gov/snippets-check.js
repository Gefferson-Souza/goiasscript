'use strict';
const fs = require('fs');
const path = require('path');
const { probe } = require('./lib-probe');

const repo = '<repo>';
const snippets = JSON.parse(fs.readFileSync(path.join(repo, 'vscode-extension/snippets/goiasscript.json'), 'utf8'));

const VARIABLES = {
  CURRENT_YEAR: '2026',
  CURRENT_MONTH: '10',
  CURRENT_DATE: '13',
  TM_FILENAME_BASE: 'arquivo',
};

function expand(body) {
  const defaults = new Map();
  const defaultRegex = /\$\{(\d+):((?:[^{}]|\{[^{}]*\})*)\}/g;
  let m;
  while ((m = defaultRegex.exec(body)) !== null) {
    if (!defaults.has(m[1])) defaults.set(m[1], m[2]);
  }
  let out = body;
  out = out.replace(/\$\{(\d+)\|([^|}]*)\|\}/g, (_, idx, choices) => choices.split(',')[0]);
  out = out.replace(/\$\{(\d+):((?:[^{}]|\{[^{}]*\})*)\}/g, (_, idx, def) => def);
  out = out.replace(/\$\{([A-Z_]+)\}/g, (_, name) => VARIABLES[name] || '');
  out = out.replace(/\$\{(\d+)\}|\$(\d+)/g, (_, a, b) => defaults.get(a || b) || '');
  return out;
}

const rows = [];
for (const [name, snippet] of Object.entries(snippets)) {
  const raw = Array.isArray(snippet.body) ? snippet.body.join('\n') : snippet.body;
  const source = expand(raw);
  const r = probe(source);
  let status;
  if (!r.transpiled) status = 'NAO_TRANSPILA';
  else if (r.syntaxOk === false) status = 'SINTAXE_JS_INVALIDA';
  else if (r.runOk === false && /ReferenceError/.test(r.error || '')) status = 'OK_SINTAXE(ref indef. esperado)';
  else if (r.runOk === false) status = 'ERRO_EXECUCAO';
  else status = 'OK';
  rows.push({ name, prefix: snippet.prefix, status, error: r.error, userJs: r.userJs });
}

const counts = {};
for (const row of rows) counts[row.status] = (counts[row.status] || 0) + 1;
console.log('TOTAL snippets:', rows.length, JSON.stringify(counts));
for (const row of rows) {
  console.log(`${row.status.padEnd(34)} [${row.prefix}] (${row.name})${row.error ? '  -> ' + row.error : ''}`);
}
fs.writeFileSync(path.join(__dirname, 'snippets-check.json'), JSON.stringify(rows, null, 2));
