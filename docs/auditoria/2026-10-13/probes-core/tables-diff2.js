'use strict';
// Corrige a seção 4 de tables-diff.js: testa _convertJSMethodsToGoiano diretamente com a amostra certa por entrada.
const { SimpleTranspiler, GoianoBuiltins, RUNTIME, transpile } = require('./harness');
const t = new SimpleTranspiler();
const b = new GoianoBuiltins();
const ZERO_ARG = new Set(['toUpperCase', 'toLowerCase', 'trim', 'pop', 'shift', 'reverse']);
const OBJECT_STATICS = new Set(['keys', 'values', 'entries', 'assign']);

function sampleFor(js) {
  if (js === 'length') return 'x.length';
  if (js.startsWith('Math.') || js.startsWith('console.')) return js === 'Math.random' ? 'Math.random()' : `${js}(1)`;
  if (OBJECT_STATICS.has(js)) return `Object.${js}(1)`;
  if (['parseInt', 'parseFloat', 'isNaN', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval'].includes(js)) return `${js}(1)`;
  if (ZERO_ARG.has(js)) return `x.${js}()`;
  return `x.${js}(1)`;
}

const rows = Object.entries(b.metodosGoianos).map(([js, goiano]) => {
  const sample = sampleFor(js);
  const converted = t._convertJSMethodsToGoiano(sample);
  const leaf = goiano;
  return { js, goiano, sample, converted, rewritten: converted.includes(leaf) };
});
const semRegra = rows.filter(r => !r.rewritten);
console.log(`metodosGoianos=${rows.length} | com regra de reescrita=${rows.length - semRegra.length} | sem regra=${semRegra.length}`);
console.log('sem regra (amostra -> resultado):');
semRegra.forEach(r => console.log(`   ${r.js} -> ${r.goiano}   amostra "${r.sample}" => "${r.converted}"`));

console.log('\nRegras de reescrita que NÃO têm entrada em metodosGoianos (fonte da verdade duplicada):');
const src = require('fs').readFileSync('<repo>/packages/core/src/compiler/simpleTranspiler.js', 'utf8');
const rewriteTargets = [...src.matchAll(/result\.replace\(\/([^/]+)\/g, '([^']+)'\)/g)].map(m => ({ regex: m[1], to: m[2] }));
const goianoValues = new Set(Object.values(b.metodosGoianos).map(v => v.replace('GoianoMath.', '').replace(/\(\)?$/, '')));
const orphan = rewriteTargets.filter(r => { const leaf = r.to.replace(/^\./, '').replace(/^GoianoMath\./, '').replace(/^Object\./, '').replace(/\(.*$/, ''); return !goianoValues.has(leaf); });
console.log(`regras de reescrita=${rewriteTargets.length}; sem correspondente em metodosGoianos=${orphan.length}: ${orphan.map(o => `${o.regex}->${o.to}`).join(', ') || '-'}`);

console.log('\n=== Quais avisos de _checkForbiddenMethods conseguem disparar com CÓDIGO real (fora de string)? ===');
const probes = [
  ['.replace(', 'uai a é "x"; a.replace("x", "y");'],
  ['.split(', 'uai a é "x"; a.split(",");'],
  ['.join(', '[1].join(",");'],
  ['.toUpperCase()', '"a".toUpperCase();'],
  ['.toLowerCase()', '"a".toLowerCase();'],
  ['.map(', '[1].map(x => x);'],
  ['.filter(', '[1].filter(x => x);'],
  ['.reduce(', '[1].reduce((a, b) => a + b, 0);'],
  ['.forEach(', '[1].forEach(x => x);'],
  ['.push(', '[].push(1);'],
  ['.pop()', '[1].pop();'],
  ['Math.random()', 'Math.random();'],
  ['Math.floor(', 'Math.floor(1.5);'],
  ['console.log(', 'console.log("x");'],
  ['parseInt(', 'parseInt("1");'],
  ['setTimeout(', 'setTimeout(() => 1, 1);'],
  ['prosa("x") (keyword goiana)', 'prosa("x");'],
];
for (const [label, code] of probes) {
  const r = transpile(code);
  const fired = (r.warnings || []).map(w => (/método "([^"]+)"/.exec(w.message) || [])[1]);
  console.log(`${label.padEnd(30)} -> avisos: ${fired.length ? fired.join(', ') : '(nenhum)'}`);
}
