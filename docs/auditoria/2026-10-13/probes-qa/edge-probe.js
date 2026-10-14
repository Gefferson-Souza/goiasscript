// Probe de bordas: o que a suíte atual NÃO testa e o que o transpilador faz com isso.
// Mostra só o trecho do usuário (sem o runtime de 246 linhas) e se o JS gerado é parseável/executável.
const path = require('path');
const vm = require('vm');
const core = process.argv[2];
const { GoiasScriptBrowserCompiler } = require(path.join(core, 'src/browser'));
const GoianoBuiltins = require(path.join(core, 'src/goianoMethods/GoianoBuiltins'));
const runtime = new GoianoBuiltins().gerarImplementacaoGoiana();
const compiler = new GoiasScriptBrowserCompiler();

function userPart(js) {
  const prefix = runtime + '\n\n';
  return js.startsWith(prefix) ? js.slice(prefix.length) : js;
}

function run(js) {
  const out = [];
  const ctx = vm.createContext({
    console: { log: (...a) => out.push(a.join(' ')), error: (...a) => out.push('ERR ' + a.join(' ')), warn: () => {} },
    setTimeout,
    Promise,
  });
  try {
    vm.runInContext(js, ctx, { timeout: 2000 });
    return `exec ok -> ${JSON.stringify(out)}`;
  } catch (e) {
    return `exec ERRO ${e.name}: ${e.message}`;
  }
}

const cases = [
  ['template literal com palavra-chave no texto', 'uai n é 3;\nprosa(`Tem mais de ${n} em estoque, nada a declarar`);'],
  ['palavra-chave dentro de string simples', 'prosa("Tem mais de 3 em estoque, nada a declarar");'],
  ['palavra-chave em comentario', '// uai isso é um trem de comentario com mais de nada\nprosa("oi");'],
  ['regex literal com palavra-chave', 'uai r é /mais|menos/;\nprosa(r.test("mais"));'],
  ['string nao fechada', 'prosa("abc);'],
  ['placeholder colide com identificador', 'uai __STRING_0__ é 5;\nprosa("a");\nprosa(__STRING_0__);'],
  ['codigo vazio', ''],
  ['so comentario', '// nada'],
  ['aspas aninhadas/escapadas', 'prosa("ele disse \\"mais\\" ontem");'],
  ['propriedade chamada "de"/"em"', 'uai o é { de: 1, em: 2 };\nprosa(o.de mais o.em);'],
  ['identificador contendo palavra-chave', 'uai mais_um é 1;\nuai demais é 2;\nprosa(mais_um mais demais);'],
  ['uso de .length (convertido para .tamanho())', 'uai l é [1,2,3];\nprosa(l.length);'],
  ['objeto com campo length', 'uai o é { length: 7 };\nprosa(o.length);'],
  ['string.length em string vazia', 'prosa("".length);'],
  ['Math.max com spread', 'prosa(Math.max(...[1,5,3]));'],
  ['comparacao encadeada com e_mais', 'uai a é 5;\nse_ocê_quiser (a maior_que 1 e_mais a menor_que 10) { prosa("dentro"); }'],
  ['else if', 'uai a é 5;\nse_ocê_quiser (a maior_que 9) { prosa("A"); } se_num_for (a maior_que 3) { prosa("B"); } se_não { prosa("C"); }'],
  ['while + break', 'uai i é 0;\nenquanto_tiver (certeza) { i é i mais 1; se_ocê_quiser (i pelo_menos 3) { para_com_isso; } }\nprosa(i);'],
  ['try/catch/finally', 'tenta_aí { vixe "xi"; } se_der_ruim (e) { prosa(e.message); } por_fim { prosa("fim"); }'],
  ['for', 'vai_indo (uai i é 0; i menor_que 3; i é i mais 1) { prosa(i); }'],
];

let invalid = 0;
for (const [title, src] of cases) {
  const r = compiler.transpile(src, 'probe.gs');
  console.log(`\n### ${title}`);
  console.log(`gs : ${JSON.stringify(src)}`);
  if (!r.success) {
    console.log(`transpile: success=false  erro=${r.error && r.error.message}`);
    continue;
  }
  const part = userPart(r.code);
  console.log(`js : ${JSON.stringify(part)}`);
  console.log(`warnings: ${(r.warnings || []).length}`);
  let parse = 'parse ok';
  try {
    new vm.Script(r.code);
  } catch (e) {
    parse = `parse INVALIDO (${e.message})`;
    invalid++;
  }
  console.log(`${parse}; ${parse === 'parse ok' ? run(r.code) : ''}`);
}
console.log(`\nJS invalido gerado com success=true em ${invalid} casos`);
