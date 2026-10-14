'use strict';
const { loadGrammar, tokenizeDocument } = require('./lib-grammar');
(async () => {
  const grammar = await loadGrammar();
  const cases = [
    'uai p é { nome: "Maria", idade: 30 }',
    'uai r é a maior_que b ? 1 : 2',
    'uai t é `olá ${nome} se_ocê_quiser`',
    "prosa('uai dentro de aspas simples')",
    'uai url é "http://exemplo.com" // comentário',
    'uai pi é GoianoMath.PI',
    'lista.pra_cada(x => prosa(x))',
    'prosa(`total: ${a mais b}`)',
    'uai re é /se_ocê_quiser/g',
    'uai x: texto é "a"',
  ];
  for (const line of cases) {
    const [{ tokens }] = tokenizeDocument(grammar, line);
    console.log(line);
    console.log('   ' + tokens.filter(t => t.text.trim()).map(t => `${JSON.stringify(t.text)}=${t.scopes.slice(1).map(s => s.replace('.goiasscript', '')).join('+') || '-'}`).join('  '));
  }
})();
