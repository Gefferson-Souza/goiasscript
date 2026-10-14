'use strict';
const { performance } = require('perf_hooks');
const { SimpleTranspiler } = require('./harness');
const poc = require('./proto-transpile');
const prod = new SimpleTranspiler();
const median = xs => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
function time(fn, runs = 5) { const s = []; for (let i = 0; i < runs; i++) { const t = performance.now(); fn(); s.push(performance.now() - t); } return median(s); }
function block(i) {
  return [`faz_trem calcula${i}(a, b) {`, `  uai soma${i} é a mais b;`, `  se_ocê_quiser (soma${i} maior_que ${i}) {`, `    prosa("Resultado grande: " mais soma${i});`, `  } se_não {`, `    prosa("Resultado pequeno: " mais soma${i});`, `  }`, `  vai_indo (trem j é 0; j menor_que 3; j é j mais 1) {`, `    uai item${i} é "valor-" mais j;`, `    prosa(item${i});`, `  }`, `  faz_favor soma${i};`, `}`, ``].join('\n');
}
const realistic = n => Array.from({ length: Math.ceil(n / 15) }, (_, i) => block(i)).join('\n');
const stringy = n => Array.from({ length: n }, (_, i) => `prosa("linha ${i}");`).join('\n');
console.log('linhas | produção (ms) | PoC por tokens (ms) | PoC ok?');
for (const [label, src] of [['10k realista', realistic(10000)], ['20k realista', realistic(20000)], ['40k realista', realistic(40000)], ['20k só strings', stringy(20000)]]) {
  const r = poc.transpile(src);
  const p = time(() => prod.transpile(src), 3);
  const q = time(() => poc.transpile(src), 3);
  console.log(`${label.padEnd(15)} ${String(Math.round(src.split('\n').length)).padStart(6)} | ${p.toFixed(1).padStart(13)} | ${q.toFixed(1).padStart(19)} | ${r.ok}${r.ok ? '' : ' ' + JSON.stringify(r.error)}`);
}
