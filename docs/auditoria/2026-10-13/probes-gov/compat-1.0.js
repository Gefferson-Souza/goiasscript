'use strict';
// Compara o vocabulário do compilador 1.0.x (b2fdb21:goiasscript.js) com a tabela canônica do 1.5.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const repo = '<repo>';
const src = execFileSync('git', ['-C', repo, 'show', 'b2fdb21:goiasscript.js'], { maxBuffer: 1 << 24 }).toString('utf8');

const start = src.indexOf('this.keywords = {');
const end = src.indexOf('};', start);
const block = src.slice(start, end);
const old = new Map();
for (const m of block.matchAll(/^\s*'?([\p{L}_][\p{L}\p{N}_]*)'?\s*:\s*'([^']*)'/gmu)) old.set(m[1], m[2]);

const table = JSON.parse(fs.readFileSync(path.join(__dirname, 'mapping-table.json'), 'utf8')).unique;
const cur = new Map(table.map(e => [e.goias, e.js]));

const removed = [...old.keys()].filter(k => !cur.has(k));
const kept = [...old.keys()].filter(k => cur.has(k));
const changed = kept.filter(k => old.get(k) !== cur.get(k));
const added = [...cur.keys()].filter(k => !old.has(k));
console.log(`1.0.x: ${old.size} entradas | 1.5: ${cur.size} chaves`);
console.log(`mantidas: ${kept.length} (com tradução JS diferente: ${changed.length})`);
console.log('mantidas com JS diferente:', changed.map(k => `${k}: ${old.get(k)} -> ${cur.get(k)}`).join(' | ') || '-');
console.log(`REMOVIDAS no 1.5 (${removed.length}):`, removed.map(k => `${k}->${old.get(k)}`).join(' '));
console.log(`NOVAS no 1.5 (${added.length}):`, added.join(' '));
