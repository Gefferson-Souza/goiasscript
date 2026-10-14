'use strict';
const fs = require('fs');
const path = require('path');

const repo = '<repo>';
const table = JSON.parse(fs.readFileSync(path.join(__dirname, 'mapping-table.json'), 'utf8'));
const keys = table.unique.map(e => e.goias);

const docs = [
  'README.md',
  'docs/METODOS_GOIANOS.md',
  'CLAUDE.md',
  'CONTRIBUTING.md',
  'packages/core/examples/README.md',
  'packages/core/templates/projeto-basico/README.md',
  'vscode-extension/README.md',
];

const boundary = word => new RegExp(`(?<![\\p{L}\\p{N}_])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}_])`, 'u');
const texts = Object.fromEntries(docs.map(d => [d, fs.readFileSync(path.join(repo, d), 'utf8')]));

// exemplos .gs também contam como "documentação por exemplo"
function listGs(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listGs(full));
    else if (entry.name.endsWith('.gs')) out.push(full);
  }
  return out;
}
const gsText = listGs(path.join(repo, 'packages/core/examples')).map(f => fs.readFileSync(f, 'utf8')).join('\n');

const perDoc = {};
for (const d of docs) perDoc[d] = keys.filter(k => boundary(k).test(texts[d])).length;

const inNoMarkdown = keys.filter(k => !docs.some(d => boundary(k).test(texts[d])));
const inNoMarkdownNoExample = inNoMarkdown.filter(k => !boundary(k).test(gsText));
const inNoExample = keys.filter(k => !boundary(k).test(gsText));

console.log('Chaves canônicas:', keys.length);
for (const [d, n] of Object.entries(perDoc)) console.log(`  ${d.padEnd(52)} cita ${String(n).padStart(2)}/${keys.length}`);
console.log(`Chaves que NÃO aparecem em nenhum markdown (${inNoMarkdown.length}): ${inNoMarkdown.join(' ')}`);
console.log(`Chaves que NÃO aparecem em nenhum exemplo .gs (${inNoExample.length}): ${inNoExample.join(' ')}`);
console.log(`Chaves em nenhum markdown E nenhum exemplo (${inNoMarkdownNoExample.length}): ${inNoMarkdownNoExample.join(' ')}`);
