'use strict';
const fs = require('fs');
const path = require('path');

const repo = '<repo>';
const read = rel => fs.readFileSync(path.join(repo, rel), 'utf8');

const table = JSON.parse(fs.readFileSync(path.join(__dirname, 'mapping-table.json'), 'utf8'));
const canonical = new Set(table.unique.map(e => e.goias));

// (B) palavras citadas nas alternâncias da gramática TextMate
const grammar = JSON.parse(read('vscode-extension/syntaxes/goiasscript.tmLanguage.json'));
const grammarWords = new Set();
(function walk(node) {
  if (Array.isArray(node)) return node.forEach(walk);
  if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (key === 'match' && typeof value === 'string') {
        for (const group of value.matchAll(/\(([^()]*\|[^()]*)\)/g)) {
          for (const word of group[1].split('|')) {
            const clean = word.replace(/\\[bs]/g, '').replace(/^\?[:<=!]+/, '').trim();
            if (/^[\p{L}\p{N}_@]+$/u.test(clean)) grammarWords.add(clean);
          }
        }
      } else walk(value);
    }
  }
})(grammar);

// (C) listas do Monarch no playground
const monarchSource = read('apps/playground/lib/monaco-goias.ts');
const monarchWords = new Set();
for (const list of ['keywords', 'storage', 'constants', 'types', 'operators', 'builtins']) {
  const m = monarchSource.match(new RegExp(`${list}:\\s*\\[([\\s\\S]*?)\\]`));
  if (m) for (const w of m[1].matchAll(/'([^']+)'/g)) monarchWords.add(w[1]);
}

// (D) CLAUDE.md: "- `x` → js" na seção de keywords
const claude = read('CLAUDE.md');
const claudeSection = claude.slice(claude.indexOf('Mapeamento de Keywords'), claude.indexOf('Extensão VS Code'));
const claudeWords = new Set();
for (const m of claudeSection.matchAll(/^\s*-\s+`([^`]+?)(?:\(\))?`\s+→/gm)) claudeWords.add(m[1]);

// (E) README raiz: tabelas "| `x` | `js` |"
const readme = read('README.md');
const readmeWords = new Set();
for (const m of readme.matchAll(/^\|\s*`([^`|]+)`\s*\|\s*`/gm)) readmeWords.add(m[1].replace(/\\/g, ''));

// (G) lexer.js
const lexer = read('packages/core/src/compiler/lexer.js');
const lexerWords = new Set();
const kwBlock = lexer.match(/keywords\s*=\s*(?:new Map\(\[|\{)([\s\S]*?)(?:\]\)|\n\s*\};)/);
if (kwBlock) for (const m of kwBlock[1].matchAll(/['"]?([\p{L}_]+)['"]?\s*[:,]/gu)) lexerWords.add(m[1]);

const sources = { 'TextMate (extensão)': grammarWords, 'Monarch (playground)': monarchWords, 'CLAUDE.md': claudeWords, 'README (tabelas)': readmeWords, 'lexer.js': lexerWords };

console.log(`transpiler: ${canonical.size} chaves canônicas`);
for (const [name, set] of Object.entries(sources)) {
  const extra = [...set].filter(w => !canonical.has(w));
  const missing = [...canonical].filter(w => !set.has(w));
  console.log(`\n== ${name}: ${set.size} termos`);
  console.log(`  fora do transpiler (${extra.length}): ${extra.join(' ')}`);
  console.log(`  chaves do transpiler ausentes (${missing.length}): ${missing.join(' ')}`);
}
