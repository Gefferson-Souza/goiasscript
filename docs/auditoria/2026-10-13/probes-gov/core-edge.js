'use strict';
const { probe } = require('./lib-probe');
const cases = [
  ['DEVELOPMENT-fix: continua_aí/para_com_isso seguidos de ;', 'trem a é 0\nenquanto_tiver (a menor_que 5) {\n  continua_aí;\n  para_com_isso;\n}'],
  ['de_jeito_nenhum seguido de ;', 'uai c é de_jeito_nenhum;\nprosa(c)'],
  ['template literal com keyword dentro', 'uai a é 1\nuai b é 2\nprosa(`soma: ${a} mais ${b}`)'],
  ['comentário com keyword', '// Clica em mais um\nprosa("oi")'],
  ['identificador chamado "de"', 'uai de é 1\nprosa(de)'],
  ['identificador chamado "mais"', 'uai mais é 1\nprosa(mais)'],
  ['propriedade chamada "nada"', 'uai o é { nada: 1 }\nprosa(o.nada)'],
  ['chave de objeto "em"', 'uai o é { em: 1 }\nprosa(o.em)'],
  ['string com aspas simples + keyword', "prosa('mais um trem')"],
  ['ASI: linha iniciando com [', 'uai a é "x"\n[1, 2].mapear(n => n)'],
];
for (const [name, src] of cases) {
  const r = probe(src);
  console.log('### ' + name);
  console.log('  fonte      : ' + JSON.stringify(src));
  console.log('  js usuário : ' + JSON.stringify(r.userJs));
  console.log('  sintaxe ok : ' + r.syntaxOk + ' | rodou ok: ' + r.runOk + (r.error ? ' | ' + r.error : '') + (r.output.length ? ' | saída: ' + JSON.stringify(r.output) : ''));
}
