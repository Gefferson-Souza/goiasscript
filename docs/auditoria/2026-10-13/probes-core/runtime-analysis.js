'use strict';
// Análise do runtime injetado por gerarImplementacaoGoiana(): tamanho, globais, protótipos, descritores,
// colisões, custo de parse/execução e poluição do processo hospedeiro (caminho eval do CLI).
const vm = require('vm');
const zlib = require('zlib');
const { performance } = require('perf_hooks');
const { RUNTIME, GoianoBuiltins } = require('./harness');

console.log('=== 1) Tamanho ===');
const bytes = Buffer.byteLength(RUNTIME);
console.log(`runtime: ${RUNTIME.length} chars, ${bytes} bytes, ${RUNTIME.split('\n').length} linhas, gzip=${zlib.gzipSync(RUNTIME).length} bytes`);
const hello = 'prosa("oi");';
console.log(`entrada "${hello}" (${hello.length} bytes) -> saída ${bytes + 2 + 'console.log("oi");'.length} bytes (fator ${(bytes / hello.length).toFixed(0)}x)`);

console.log('\n=== 2) Globais criados e protótipos nativos alterados (contexto vm novo) ===');
const targets = {
  'String.prototype': c => c.String.prototype,
  'Array.prototype': c => c.Array.prototype,
  'Object.prototype': c => c.Object.prototype,
  'Date.prototype': c => c.Date.prototype,
  'Object (estáticos)': c => c.Object,
  'Math': c => c.Math,
  'globalThis': c => c,
};
const ctx = vm.createContext({ console: { log() {}, error() {}, warn() {} }, setTimeout, clearTimeout, setInterval, clearInterval });
const before = {};
for (const [name, get] of Object.entries(targets)) before[name] = new Set(Reflect.ownKeys(get(vm.runInContext('globalThis', ctx))).map(String));
vm.runInContext(RUNTIME, ctx);
const g = vm.runInContext('globalThis', ctx);
let totalAdded = 0;
const added = {};
for (const [name, get] of Object.entries(targets)) {
  const obj = get(g);
  const now = Reflect.ownKeys(obj).map(String);
  const novos = now.filter(k => !before[name].has(k));
  added[name] = novos;
  totalAdded += novos.length;
  const enumerable = novos.filter(k => Object.getOwnPropertyDescriptor(obj, k).enumerable);
  console.log(`${name.padEnd(20)} +${String(novos.length).padStart(2)} propriedades (${enumerable.length} enumeráveis): ${novos.join(', ')}`);
}
console.log(`TOTAL de propriedades novas: ${totalAdded}`);
console.log('bindings lexicais de topo (const) fora do objeto global:', ['certeza', 'de_jeito_nenhum', 'GoianoMath'].map(n => `${n}=${vm.runInContext(`typeof ${n}`, ctx)}`).join(', '));

console.log('\n=== 3) Descritores das propriedades adicionadas (amostra) ===');
for (const [obj, key] of [[g.String.prototype, 'trocar'], [g.Array.prototype, 'mapear'], [g.Object.prototype, 'tem_propriedade'], [g.Date.prototype, 'pegar_ano'], [g.Object, 'chaves'], [g, 'prosa']]) {
  const d = Object.getOwnPropertyDescriptor(obj, key);
  console.log(`${key.padEnd(16)} enumerable=${d.enumerable} writable=${d.writable} configurable=${d.configurable}`);
}

console.log('\n=== 4) Sobrescreve algo que já existia no Node atual? ===');
const overwritten = Object.entries(added).flatMap(([name, keys]) => keys.filter(k => before[name].has(k)).map(k => `${name}.${k}`));
console.log(overwritten.length ? overwritten.join(', ') : 'nenhuma propriedade nativa preexistente foi sobrescrita (apenas adições)');

console.log('\n=== 5) Efeitos observáveis no código do usuário (mesmo contexto) ===');
const probes = [
  ['for (k in {a:1})', '(() => { const o = []; for (const k in { a: 1 }) o.push(k); return o.join(","); })()'],
  ['for (i in [10])', '(() => { const o = []; for (const i in [10]) o.push(i); return o.length + " chaves: " + o.slice(0, 4).join(",") + ",..."; })()'],
  ['Object.keys({a:1})', 'Object.keys({ a: 1 }).join(",")'],
  ['JSON.stringify({a:[1]})', 'JSON.stringify({ a: [1] })'],
  ['typeof ({}).tem_propriedade (existe em todo objeto)', 'typeof ({}).tem_propriedade'],
  ['typeof Object.create(null).tem_propriedade', 'typeof Object.create(null).tem_propriedade'],
  ['Object.getOwnPropertyNames(Array.prototype).length', 'Object.getOwnPropertyNames(Array.prototype).length'],
];
for (const [label, code] of probes) console.log(`${label.padEnd(52)} -> ${vm.runInContext(code, ctx)}`);

console.log('\n=== 6) Custo de parse + execução do runtime (por execução de programa) ===');
{
  const N = 300;
  let t0 = performance.now();
  for (let i = 0; i < N; i++) new vm.Script(`${RUNTIME}\n//u${i}`);
  const parse = (performance.now() - t0) / N;
  t0 = performance.now();
  for (let i = 0; i < N; i++) {
    const c = vm.createContext({ console: { log() {}, error() {}, warn() {} }, setTimeout, clearTimeout, setInterval, clearInterval });
    vm.runInContext(RUNTIME, c);
  }
  const full = (performance.now() - t0) / N;
  t0 = performance.now();
  for (let i = 0; i < N; i++) vm.createContext({ console: {} });
  const ctxOnly = (performance.now() - t0) / N;
  console.log(`parse do runtime (vm.Script com fonte única por iteração, sem cache hit): ${parse.toFixed(3)} ms`);
  console.log(`criar contexto + executar runtime: ${full.toFixed(3)} ms | só criar contexto: ${ctxOnly.toFixed(3)} ms | execução líquida do runtime ≈ ${(full - ctxOnly).toFixed(3)} ms`);
}

console.log('\n=== 7) Poluição do processo hospedeiro quando o CLI usa eval no próprio processo (bin/goiasscript.js:86) ===');
{
  const before2 = (() => { const o = []; for (const k in {}) o.push(k); return o; })();
  // eslint-disable-next-line no-eval
  eval(RUNTIME);
  const after2 = (() => { const o = []; for (const k in {}) o.push(k); return o; })();
  const arr = (() => { const o = []; for (const k in [1]) o.push(k); return o; })();
  console.log(`for..in em {} antes do eval: [${before2}] | depois: [${after2}]`);
  console.log(`for..in em [1] depois do eval: ${arr.length} chaves (índice + ${arr.length - 1} métodos goianos)`);
  console.log(`typeof globalThis.prosa depois do eval: ${typeof globalThis.prosa}`);
}
