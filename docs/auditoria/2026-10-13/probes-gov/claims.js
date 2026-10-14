'use strict';
const { probe } = require('./lib-probe');

const cases = [
  ['CLAUDE.md: "se" simples', 'uai x é 5\nse (x maior_que 1) { prosa("maior") }'],
  ['CLAUDE.md: "senao"', 'uai x é 0\nse_ocê_quiser (x maior_que 1) { prosa("a") } senao { prosa("b") }'],
  ['CLAUDE.md: "fazer" (alias de function)', 'fazer soma(a, b) { faz_favor a mais b }\nprosa(soma(1, 2))'],
  ['CLAUDE.md: .gritando()', 'prosa("oi".gritando())'],
  ['CLAUDE.md: .cochichando()', 'prosa("OI".cochichando())'],
  ['CLAUDE.md: .tem_no_meio()', 'prosa("abc".tem_no_meio("b"))'],
  ['CLAUDE.md: .bota_no_final()', 'uai l é [1]\nl.bota_no_final(2)\nprosa(l)'],
  ['CLAUDE.md: .arranca_o_rabo()', 'uai l é [1, 2]\nl.arranca_o_rabo()\nprosa(l)'],
  ['CLAUDE.md: GoianoMath.sorteia_um()', 'prosa(GoianoMath.sorteia_um())'],
  ['README: GoianoMath.sorteio()', 'prosa(GoianoMath.sorteio() menor_que 1)'],
  ['CLAUDE.md: tipos (uai x: texto)', 'uai x: texto é "a"\nprosa(x)'],
  ['CLAUDE.md: tipo errado (uai x: numero é "a")', 'uai x: numero é "a"\nprosa(x)'],
  ['CLAUDE.md: modulos pega/troca_ideia', 'pega { a } de "./x.gs"\nprosa(a)'],
  ['CLAUDE.md: exportar troca_ideia', 'troca_ideia faz_trem f() { faz_favor 1 }'],
  ['ext README: vai_na_frente presta_serviço', 'vai_na_frente presta_serviço carrega() { faz_favor 1 }'],
  ['METODOS: .map JS "bloqueado/warning"', 'uai r é [1, 2].map(x => x * 2)\nprosa(r)'],
  ['METODOS: Math.random "bloqueado/warning"', 'prosa(Math.random() menor_que 1)'],
  ['METODOS: console.log direto', 'console.log("oi")'],
  ['prosa simples (gera aviso falso?)', 'prosa("oi")'],
  ['ext README: se_der_ruim (erro)', 'tenta_aí { vixe("x") } se_der_ruim (erro) { reclama("falhou") }'],
  ['classes goianas', 'arruma_trem Bixo { aprepara_trem(nome) { ocê.nome é nome } fala() { faz_favor "oi " mais ocê.nome } }\nprosa(faz_um Bixo("Zé").fala())'],
];

for (const [name, source] of cases) {
  const r = probe(source);
  console.log('### ' + name);
  console.log('  fonte      : ' + JSON.stringify(source));
  console.log('  transpilou : ' + r.transpiled + ' | sintaxe JS ok: ' + r.syntaxOk + ' | rodou ok: ' + r.runOk);
  if (r.userJs !== null) console.log('  js usuário : ' + JSON.stringify(r.userJs));
  if (r.warnings.length) console.log('  avisos     : ' + JSON.stringify(r.warnings));
  if (r.output.length) console.log('  saída      : ' + JSON.stringify(r.output));
  if (r.error) console.log('  erro       : ' + r.error);
}
