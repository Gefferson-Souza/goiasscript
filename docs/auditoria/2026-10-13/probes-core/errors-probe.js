'use strict';
// Erros reais do ciclo .gs -> JS -> execução, passados pelo ErrorTranslator.
// Mede: o erro nativo, o que o translator devolve (mensagem/dica/linha/coluna) e se a linha bate com a do .gs.
const { transpile, ErrorTranslator, ErroGoiano, show } = require('./harness');

const OFFSET = 247; // linhas do runtime antes do código do usuário (medido: 1ª linha do usuário = linha 248)
const translator = new ErrorTranslator();

const scenarios = [
  { id: 'E1', nome: 'variável inexistente', gs: ['uai a é 1;', 'prosa(a);', 'prosa(naoExiste);'], gsLine: 3 },
  { id: 'E2', nome: 'chamar string como função', gs: ['uai coisa é "texto";', 'prosa("antes");', 'coisa();'], gsLine: 3 },
  { id: 'E3', nome: 'ler propriedade de null (nada)', gs: ['uai o é nada;', 'prosa("antes");', 'prosa(o.x);'], gsLine: 3 },
  { id: 'E4', nome: 'sintaxe: parêntese aberto', gs: ['uai a é 1;', 'uai x é (;', 'prosa(a);'], gsLine: 2 },
  { id: 'E5', nome: 'recursão infinita', gs: ['faz_trem f() { f(); }', 'prosa("antes");', 'f();'], gsLine: 1 },
  { id: 'E6', nome: 'identificador acentuado inexistente', gs: ['prosa("antes");', 'prosa(número_inexistente);'], gsLine: 2 },
  { id: 'E7', nome: '.length em objeto do usuário', gs: ['uai o é { length: 3 };', 'prosa(o.length);'], gsLine: 2 },
  { id: 'E8', nome: 'reatribuir uai (const)', gs: ['uai x é 1;', 'x é 2;', 'prosa(x);'], gsLine: 2 },
  { id: 'E9', nome: 'JSON.parse inválido (SyntaxError de runtime)', gs: ['prosa("antes");', 'JSON.parse("{");'], gsLine: 2 },
  { id: 'E10', nome: 'erro lançado pelo usuário com vixe', gs: ['prosa("antes");', 'vixe("quebrou de propósito");'], gsLine: 2 },
  { id: 'E11', nome: 'erro de digitação em método goiano', gs: ['uai l é [1, 2];', 'prosa(l.mapeear(x => x));'], gsLine: 2 },
  { id: 'E12', nome: 'palavra goiana desconhecida (presta_serviço)', gs: ['presta_serviço soma(a, b) {', '  faz_favor a mais b;', '}', 'prosa(soma(1, 2));'], gsLine: 1 },
];

function runDirectEval(js) {
  // imita bin/goiasscript.js:86 — eval direto dentro de um método
  return (function hostMethod() {
    // eslint-disable-next-line no-eval
    return eval(js);
  })();
}

for (const sc of scenarios) {
  const src = sc.gs.join('\n');
  const t = transpile(src);
  console.log(`\n### ${sc.id} — ${sc.nome} (erro real na linha ${sc.gsLine} do .gs)`);
  if (!t.success) {
    console.log(`  transpile falhou: ${t.error.message}`);
    continue;
  }
  let raw;
  try {
    runDirectEval(t.code);
    console.log('  (executou sem erro)');
    continue;
  } catch (error) {
    raw = error;
  }
  const translated = translator.translate(raw, 'prog.gs');
  const stackFirst = (raw.stack || '').split('\n').slice(0, 2).join(' | ');
  console.log(`  erro nativo   : ${raw.name}: ${show(raw.message, 120)}`);
  console.log(`  1ª linha stack: ${show(stackFirst, 200)}`);
  console.log(`  CLI imprime   : "❌ Ô rapaz! Deu ruim na execução: ${show(raw.message, 100)}"  (bin/goiasscript.js:88 — só .message, sem linha)`);
  console.log(`  translator    : ${show(translated.message, 220)}`);
  console.log(`  dica          : ${show(translated.dica, 140)}`);
  console.log(`  linha/coluna  : ${translated.linha}/${translated.coluna} | linha real no .gs: ${sc.gsLine} | linha no JS gerado ≈ ${sc.gsLine + OFFSET}`);
  console.log(`  aponta p/ .gs?: ${translated.linha === sc.gsLine ? 'SIM' : 'NÃO'}`);
}

console.log('\n### Catálogo: tipos que o ErrorTranslator emite vs tipos conhecidos pelo ErroGoiano');
const sample = [
  ['sintaxe', 'x'], ['referencia', 'x'], ['tipo', 'x'], ['execucao', 'x'], ['falta_virgula', 'x'], ['falta_parentese', 'x'],
  ['falta_chave', 'x'], ['erro_nome', 'x'], ['divisao_zero', 'x'], ['argumento_invalido', 'x'], ['promessa_rejeitada', 'x'],
  ['importacao', 'x'], ['interno', 'x'],
  ['uri', 'x'], ['intervalo', 'x'], ['eval', 'x'],
];
for (const [tipo] of sample) {
  const e = new ErroGoiano(tipo, 'MENSAGEM', 'dica', 3, 4, 'a.gs');
  console.log(`  ${tipo.padEnd(20)} -> ${show(e.message, 110)}`);
}

console.log('\n### getDetalhes()/mostrarErro()');
{
  const e = new ErroGoiano('sintaxe', 'Sintaxe tá embrulhada que nem pamonha!', 'Dá uma olhada boa no código.', 3, 4, 'a.gs');
  console.log('  getDetalhes():', JSON.stringify(e.getDetalhes()));
  const orig = console.error;
  const lines = [];
  console.error = (...a) => lines.push(a.join(' '));
  e.mostrarErro();
  console.error = orig;
  console.log('  mostrarErro() imprime em stderr:', JSON.stringify(lines));
}
