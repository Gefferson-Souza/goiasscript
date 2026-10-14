const path = require('path');
const vm = require('vm');
const core = process.argv[2];
const GoianoBuiltins = require(path.join(core, 'src/goianoMethods/GoianoBuiltins'));
const runtime = new GoianoBuiltins().gerarImplementacaoGoiana();
const tests = [
  ['"a.b.c".trocar(".", "-")', 'a-b-c'],
  ['"1+1".trocar("+", "-")', '1-1'],
  ['"abc".pra_maiusculo()', 'ABC'],
  ['[1,2,3].mapear(x => x * 2).join(",")', '2,4,6'],
  ['[1,2,3].filtrar(x => x > 1).join(",")', '2,3'],
  ['[3,1,2].ordenar().join(",")', '1,2,3'],
  ['[1,2,3].reduzir((a, b) => a + b, 0)', 6],
  ['[1,2,3].tamanho()', 3],
  ['"abc".tamanho()', 3],
  ['GoianoMath.maior(1, 9, 3)', 9],
  ['GoianoMath.arredondar(2.5)', 3],
  ['GoianoMath.potencia(2, 10)', 1024],
  ['Object.chaves({a: 1, b: 2}).join(",")', 'a,b'],
  ['typeof GoianoMath.sorteio()', 'number'],
  ['"Goiás".pra_minusculo()', 'goiás'],
  ['"  x ".aparar()', 'x'],
  ['"abcdef".pedaco(1, 3)', 'bc'],
  ['[1,2,3].achar(x => x === 2)', 2],
  ['[1,2,3].tirar_ultimo()', 3],
  ['"abc".contem("b")', true],
  ['"abc".comeca_com("a")', true],
  ['vira_numero("42")', 42],
  ['"a,b".dividir(",").length', 2],
  ['[[1],[2]].juntar_lista([3]).length', 3],
];
let bad = 0;
const ctx = vm.createContext({ console });
vm.runInContext(runtime, ctx);
for (const [expr, expected] of tests) {
  let got;
  try { got = vm.runInContext(expr, ctx, { timeout: 1000 }); } catch (e) { got = 'ERRO ' + e.name + ': ' + e.message; }
  const ok = got === expected;
  if (!ok) bad++;
  console.log((ok ? 'ok  ' : 'FALHA') + ' ' + expr.padEnd(52) + ' esperado=' + JSON.stringify(expected) + ' obtido=' + JSON.stringify(got));
}
console.log(`\nfalhas=${bad}/${tests.length}`);
