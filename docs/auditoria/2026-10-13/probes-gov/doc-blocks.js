'use strict';
const fs = require('fs');
const path = require('path');
const { probe } = require('./lib-probe');

const repo = '<repo>';
const targets = [
  'README.md',
  'docs/METODOS_GOIANOS.md',
  'packages/core/examples/README.md',
  'packages/core/templates/projeto-basico/README.md',
  'vscode-extension/README.md',
  'apps/playground/README.md',
  'apps/engoianador-api/README.md',
];
const langs = new Set(['goiasscript', 'gs', 'goias', 'javascript', 'js']);

function extractBlocks(markdown) {
  const blocks = [];
  const regex = /^```([^\n]*)\n([\s\S]*?)^```/gm;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    const startLine = markdown.slice(0, match.index).split('\n').length;
    blocks.push({ lang: match[1].trim(), body: match[2], startLine });
  }
  return blocks;
}

const summary = [];
for (const rel of targets) {
  const file = path.join(repo, rel);
  if (!fs.existsSync(file)) continue;
  const blocks = extractBlocks(fs.readFileSync(file, 'utf8')).filter(b => langs.has(b.lang));
  for (const block of blocks) {
    const r = probe(block.body);
    let status;
    if (!r.transpiled) status = 'NAO_TRANSPILA';
    else if (r.syntaxOk === false) status = 'SINTAXE_JS_INVALIDA';
    else if (r.runOk === false && /ReferenceError/.test(r.error || '')) status = 'REF_ERROR(fragmento)';
    else if (r.runOk === false) status = 'ERRO_EXECUCAO';
    else status = 'OK';
    summary.push({ rel, line: block.startLine, lang: block.lang, status, error: r.error });
  }
}

const counts = {};
for (const s of summary) counts[s.status] = (counts[s.status] || 0) + 1;
console.log('TOTAL blocos:', summary.length, JSON.stringify(counts));
for (const s of summary) {
  console.log(`${s.status.padEnd(22)} ${s.rel}:${s.line} [${s.lang}] ${s.error ? '-> ' + s.error : ''}`);
}
