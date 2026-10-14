'use strict';
// Conta quantas vezes ErroGoiano / ErrorTranslator são realmente usados nos fluxos reais do transpilador.
// Técnica: troca o export do módulo ErroGoiano (no cache de require, em memória) por uma subclasse contadora ANTES de carregar o resto.
const CORE_SRC = '<repo>/packages/core/src';
const errPath = require.resolve(`${CORE_SRC}/errors/ErroGoiano`);
const Original = require(errPath);
const created = [];
class Counting extends Original {
  constructor(...args) {
    super(...args);
    created.push(args[0]);
  }
}
require.cache[errPath].exports = Counting;

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const SimpleTranspiler = require(`${CORE_SRC}/compiler/simpleTranspiler`);
const t = new SimpleTranspiler();

const inputs = [];
// 1) todos os `gs` string da bateria
for (const f of ['cases-1-identifiers.js', 'cases-2-strings-templates.js', 'cases-3-operators-unicode.js', 'cases-4-method-rewrite.js', 'cases-5-runtime-and-misc.js']) {
  for (const c of require(path.join(__dirname, f))) if (typeof c.gs === 'string') inputs.push({ origem: `bateria:${c.id}`, code: c.gs });
}
// 2) todos os .gs versionados
const REPO = '<repo>';
for (const rel of execFileSync('git', ['-C', REPO, 'ls-files', '*.gs'], { encoding: 'utf8' }).split('\n').filter(Boolean)) {
  inputs.push({ origem: `repo:${rel}`, code: fs.readFileSync(path.join(REPO, rel), 'utf8') });
}
// 3) blocos da documentação
for (const rel of ['README.md', 'docs/METODOS_GOIANOS.md']) {
  const md = fs.readFileSync(path.join(REPO, rel), 'utf8');
  for (const m of md.matchAll(/```goiasscript\n([\s\S]*?)```/g)) inputs.push({ origem: `doc:${rel}`, code: m[1] });
}

let ok = 0;
let failedPlain = 0;
let failedErro = 0;
const examples = [];
for (const input of inputs) {
  const before = created.length;
  const r = t.transpile(input.code, 'x.gs');
  if (r.success) ok += 1;
  else if (created.length > before) { failedErro += 1; examples.push(`${input.origem} -> ErroGoiano(${created[created.length - 1]})`); }
  else { failedPlain += 1; examples.push(`${input.origem} -> objeto simples: ${r.error.message}`); }
}
console.log(`entradas reais testadas = ${inputs.length}`);
console.log(`transpile ok = ${ok}`);
console.log(`transpile falhou com objeto simples (_validateSyntax, não é ErroGoiano) = ${failedPlain}`);
console.log(`transpile falhou com ErroGoiano (exceção interna capturada + ErrorTranslator) = ${failedErro}`);
console.log(`ErroGoiano construídos no total = ${created.length}`);
examples.slice(0, 12).forEach(e => console.log('   ' + e));

// Entradas que só passam pelo translator: tipos não-string
for (const bad of [undefined, null, 123, {}, []]) {
  const before = created.length;
  const r = t.transpile(bad, 'x.gs');
  console.log(`transpile(${util_inspect(bad)}) -> success=${r.success} ErroGoiano criado=${created.length > before}`);
}
function util_inspect(v) { return require('util').inspect(v); }
