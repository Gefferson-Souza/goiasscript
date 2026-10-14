'use strict';
const fs = require('fs');
const path = require('path');
const { loadGrammar, tokenizeDocument } = require('./lib-grammar');

const repo = '<repo>';
const table = JSON.parse(fs.readFileSync(path.join(__dirname, 'mapping-table.json'), 'utf8'));
const keywords = new Set(table.unique.map(e => e.goias));

function listGs(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listGs(full));
    else if (entry.name.endsWith('.gs')) out.push(full);
  }
  return out;
}

(async () => {
  const grammar = await loadGrammar();
  const files = [...listGs(path.join(repo, 'packages/core/examples')), ...listGs(path.join(repo, 'packages/core/templates')), ...listGs(path.join(repo, 'packages/core/tests/fixtures'))];

  const totals = { keywordOccurrences: 0, keywordUnscoped: 0, singleQuoteStrings: 0, templateStrings: 0, singleQuoteStringsScopedAsString: 0 };
  const unscopedByKeyword = {};
  const perFile = [];

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const doc = tokenizeDocument(grammar, text);
    let unscoped = 0;
    let occurrences = 0;
    for (const { tokens } of doc) {
      for (const token of tokens) {
        const word = token.text.trim();
        const isString = token.scopes.some(s => s.startsWith('string.'));
        const isComment = token.scopes.some(s => s.startsWith('comment.'));
        if (keywords.has(word) && !isString && !isComment) {
          occurrences++;
          if (token.scopes.length <= 1) {
            unscoped++;
            unscopedByKeyword[word] = (unscopedByKeyword[word] || 0) + 1;
          }
        }
      }
    }
    const singleQuoted = (text.match(/'(?:[^'\\\n]|\\.)*'/g) || []).length;
    const templates = (text.match(/`[^`]*`/g) || []).length;
    totals.keywordOccurrences += occurrences;
    totals.keywordUnscoped += unscoped;
    totals.singleQuoteStrings += singleQuoted;
    totals.templateStrings += templates;
    perFile.push({ file: path.relative(repo, file), occurrences, unscoped, singleQuoted, templates });
  }

  console.log('Arquivos .gs analisados:', files.length);
  console.log(JSON.stringify(totals));
  console.log('Palavras-chave sem escopo (contagem por termo):', JSON.stringify(unscopedByKeyword));
  for (const row of perFile) console.log(`  ${row.file.padEnd(62)} kw=${row.occurrences} semEscopo=${row.unscoped} aspasSimples=${row.singleQuoted} template=${row.templates}`);

  // Falsos positivos: palavra-chave dentro de string de aspas simples ou template
  const probes = [
    ["uai a é 'se_ocê_quiser vai_indo uai'", "'se_ocê_quiser"],
    ['uai b é `uai x é ${mais}`', 'uai x'],
    ['uai c é "uai x é 1"', 'uai x'],
    ['faz_trem somar(a, b) {', 'faz_trem'],
    ['vai_na_frente faz_trem buscar() {', 'vai_na_frente'],
    ['vai_na_frente_faz_trem buscar() {', 'vai_na_frente_faz_trem'],
    ['uai v é indefinido', 'indefinido'],
    ['uai v é nada', 'nada'],
    ['arruma_trem Cachorro inherda_de Bicho {', 'arruma_trem'],
    ['senao { }', 'senao'],
    ['se (a) { }', 'se'],
    ['fazer soma() { }', 'fazer'],
    ['"abc".gritando()', 'gritando'],
    ['lista.pra_cada(x => 1)', 'pra_cada'],
    ['lista.mapear(x => x)', 'mapear'],
    ['GoianoMath.sorteio()', 'sorteio'],
    ['vira_numero("1")', 'vira_numero'],
    ['depois_de(f, 10)', 'depois_de'],
  ];
  console.log('--- sondagens de contexto ---');
  for (const [line, needle] of probes) {
    const result = grammar.tokenizeLine(line, require(`${'/usr/share/antigravity/resources/app/node_modules'}/vscode-textmate`).INITIAL);
    const idx = line.indexOf(needle);
    const covering = result.tokens.filter(t => t.startIndex <= idx && t.endIndex > idx);
    const scopes = covering.map(t => t.scopes.slice(1).join(' ') || '(nenhum)').join(' ; ');
    console.log(`${JSON.stringify(line).padEnd(52)} "${needle}" -> ${scopes}`);
  }
})().catch(err => { console.error(err); process.exit(1); });
