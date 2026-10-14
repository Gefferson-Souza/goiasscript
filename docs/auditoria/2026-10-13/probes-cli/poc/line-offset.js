'use strict';
// PoC (fora do repo): executar o JS gerado com vm.Script + lineOffset para que o stack aponte a linha do .gs.
const vm = require('node:vm');
const fs = require('node:fs');
const Compiler = require(process.env.CORE + '/src/compiler');
const Builtins = require(process.env.CORE + '/src/goianoMethods/GoianoBuiltins');

const file = process.argv[2];
const source = fs.readFileSync(file, 'utf8');
const compiled = new Compiler().compile(source, file);
const runtime = new Builtins().gerarImplementacaoGoiana();
const prefixLines = (runtime + '\n\n').split('\n').length - 1;

const script = new vm.Script(compiled.javascript, { filename: file, lineOffset: -prefixLines });
try {
  script.runInThisContext();
} catch (error) {
  const frame = String(error.stack).split('\n').find(l => l.includes(file));
  console.log('prefixo do runtime (linhas):', prefixLines);
  console.log('mensagem V8   :', error.message);
  console.log('frame do stack:', frame.trim());
}
