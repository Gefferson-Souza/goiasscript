'use strict';
// Réplica de _applySubstitutions com medição por etapa. Valida a réplica comparando com a saída de produção.
const fs = require('fs');
const { performance } = require('perf_hooks');
const PNPM = '<repo>/node_modules/.pnpm';
const parser = require(`${PNPM}/@babel+parser@7.29.3/node_modules/@babel/parser`);
const traverse = require(`${PNPM}/@babel+traverse@7.29.0/node_modules/@babel/traverse`).default;
const { CORE_SRC, SimpleTranspiler } = require('./harness');

const tsrc = fs.readFileSync(`${CORE_SRC}/compiler/simpleTranspiler.js`, 'utf8');
let mappings = [];
traverse(parser.parse(tsrc, { sourceType: 'script' }), {
  VariableDeclarator(p) {
    if (p.node.id.name === 'mappings' && p.node.init && p.node.init.type === 'ArrayExpression') {
      mappings = p.node.init.elements.map(e => [e.elements[0].value, e.elements[1].value]);
    }
  },
});
const t = new SimpleTranspiler();

function block(i) {
  return [`faz_trem calcula${i}(a, b) {`, `  uai soma${i} é a mais b;`, `  se_ocê_quiser (soma${i} maior_que ${i}) {`, `    prosa("Resultado grande: " mais soma${i});`, `  } se_não {`, `    prosa("Resultado pequeno: " mais soma${i});`, `  }`, `  vai_indo (trem j é 0; j menor_que 3; j é j mais 1) {`, `    uai item${i} é "valor-" mais j;`, `    prosa(item${i});`, `  }`, `  faz_favor soma${i};`, `}`, ``].join('\n');
}
const src = Array.from({ length: 700 }, (_, i) => block(i)).join('\n');

function replica(code, timings) {
  let result = code;
  const placeholders = [];
  let idx = 0;
  let t0 = performance.now();
  result = result.replace(/(['"])((?:(?!\1)[^\\]|\\.)*)(\1)/g, m => { const ph = `__STRING_${idx++}__`; placeholders.push({ ph, original: m }); return ph; });
  timings.proteger = performance.now() - t0;
  t0 = performance.now();
  result = t._convertJSMethodsToGoiano(result);
  timings.reescritaMetodos = performance.now() - t0;
  t0 = performance.now();
  result = t._removeTypeAnnotations(result);
  timings.anotacoesDeTipo = performance.now() - t0;
  t0 = performance.now();
  const perPass = [];
  mappings.forEach(([w, js]) => {
    const p0 = performance.now();
    if (w === 'é') result = result.replace(/\s+é\s+/g, ' = ');
    else if (w === 'ocê') result = result.replace(/(^|\s)ocê(\s|\.)/g, '$1this$2');
    else if (w.includes('_') || /[àáâãçéêí]/.test(w)) result = result.replace(new RegExp(`(^|\\s|\\(|,|\\.)${t._escapeRegex(w)}(\\s|$|\\)|,|\\()`, 'g'), `$1${js}$2`);
    else result = result.replace(new RegExp(`\\b${t._escapeRegex(w)}\\b`, 'g'), js);
    perPass.push([w, performance.now() - p0]);
  });
  timings.passadasKeywords = performance.now() - t0;
  timings.perPass = perPass;
  t0 = performance.now();
  placeholders.forEach(({ ph, original }) => { result = result.replace(ph, original); });
  timings.restaurar = performance.now() - t0;
  return result;
}

const prod = t._applySubstitutions(src);
const tm = {};
const mine = replica(src, tm);
console.log(`réplica == produção? ${prod === mine}  (linhas=${src.split('\n').length}, KB=${(src.length / 1024).toFixed(0)}, mappings=${mappings.length})`);

const runs = Array.from({ length: 5 }, () => { const x = {}; replica(src, x); return x; });
const med = k => runs.map(r => r[k]).sort((a, b) => a - b)[2];
const parts = ['proteger', 'reescritaMetodos', 'anotacoesDeTipo', 'passadasKeywords', 'restaurar'];
const total = parts.reduce((s, k) => s + med(k), 0);
parts.forEach(k => console.log(`${k.padEnd(18)} ${med(k).toFixed(1).padStart(8)} ms  ${(100 * med(k) / total).toFixed(0).padStart(3)}%`));
console.log(`${'total (réplica)'.padEnd(18)} ${total.toFixed(1).padStart(8)} ms`);
const perPassMedian = mappings.map(([w], i) => [w, runs.map(r => r.perPass[i][1]).sort((a, b) => a - b)[2]]).sort((a, b) => b[1] - a[1]).slice(0, 5);
console.log('5 passadas mais lentas: ' + perPassMedian.map(([w, ms]) => `${w}=${ms.toFixed(1)}ms`).join(', '));
