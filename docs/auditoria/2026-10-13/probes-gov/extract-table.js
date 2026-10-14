'use strict';
const fs = require('fs');
const path = require('path');

const repo = '<repo>';
const source = fs.readFileSync(path.join(repo, 'packages/core/src/compiler/simpleTranspiler.js'), 'utf8');

const start = source.indexOf('const mappings = [');
const end = source.indexOf('];', start);
const block = source.slice(start, end);

const entries = [];
const pairRegex = /\['([^']+)',\s*'([^']+)'\]/g;
let match;
while ((match = pairRegex.exec(block)) !== null) {
  const lineNumber = source.slice(0, start + match.index).split('\n').length;
  entries.push({ goias: match[1], js: match[2], line: lineNumber });
}

const seen = new Map();
const duplicates = [];
for (const entry of entries) {
  if (seen.has(entry.goias)) duplicates.push(entry);
  else seen.set(entry.goias, entry);
}

const output = {
  totalEntries: entries.length,
  uniqueKeys: seen.size,
  duplicates,
  unique: [...seen.values()],
};
fs.writeFileSync(path.join(__dirname, 'mapping-table.json'), JSON.stringify(output, null, 2));
console.log(`entradas=${output.totalEntries} unicas=${output.uniqueKeys} duplicadas=${duplicates.map(d => d.goias + '@L' + d.line).join(',')}`);
console.log(output.unique.map(e => e.goias).join(' '));
