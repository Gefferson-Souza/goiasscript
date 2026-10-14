'use strict';
const fs = require('fs');
const path = require('path');
const { loadGrammar, scopesFor } = require('./lib-grammar');

const table = JSON.parse(fs.readFileSync(path.join(__dirname, 'mapping-table.json'), 'utf8'));

(async () => {
  const grammar = await loadGrammar();
  const rows = [];
  for (const entry of table.unique) {
    const keyword = entry.goias;
    // contexto neutro: o termo entre identificadores, como aparece em código real
    const line = `alfa ${keyword} beta`;
    const result = scopesFor(grammar, line, keyword);
    const scopes = result ? result.scopes : [];
    const covered = !!result && !result.partial && scopes.length > 0;
    rows.push({ keyword, js: entry.js, covered, scopes: Array.isArray(scopes) ? scopes.join(' | ') : '', partial: result && result.partial });
  }
  const covered = rows.filter(r => r.covered);
  const uncovered = rows.filter(r => !r.covered);
  console.log(`MAPEAMENTOS: ${rows.length} | COM ESCOPO: ${covered.length} | SEM ESCOPO: ${uncovered.length}`);
  console.log('--- SEM ESCOPO (nenhuma regra da gramática casa) ---');
  for (const r of uncovered) console.log(`  ${r.keyword}  (-> ${r.js})${r.partial ? '  [casamento parcial]' : ''}`);
  console.log('--- COM ESCOPO ---');
  for (const r of covered) console.log(`  ${r.keyword.padEnd(24)} ${r.scopes}`);
  fs.writeFileSync(path.join(__dirname, 'grammar-coverage.json'), JSON.stringify(rows, null, 2));
})().catch(err => { console.error(err); process.exit(1); });
