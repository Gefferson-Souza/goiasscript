'use strict';
// Compara a restauração atual (replace string->string por placeholder) com restauração em passada única por callback.
const { performance } = require('perf_hooks');
const { SimpleTranspiler, GoiasScriptCompiler } = require('./harness');

function block(i) {
  return [
    `faz_trem calcula${i}(a, b) {`, `  uai soma${i} é a mais b;`, `  se_ocê_quiser (soma${i} maior_que ${i}) {`,
    `    prosa("Resultado grande: " mais soma${i});`, `  } se_não {`, `    prosa("Resultado pequeno: " mais soma${i});`, `  }`,
    `  vai_indo (trem j é 0; j menor_que 3; j é j mais 1) {`, `    uai item${i} é "valor-" mais j;`, `    prosa(item${i});`, `  }`, `  faz_favor soma${i};`, `}`, ``,
  ].join('\n');
}
const src = Array.from({ length: 700 }, (_, i) => block(i)).join('\n');
const strRe = /(['"])((?:(?!\1)[^\\]|\\.)*)(\1)/g;
const placeholders = [];
const prot = src.replace(strRe, m => { placeholders.push(m); return `__STRING_${placeholders.length - 1}__`; });
const med = xs => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
function time(fn, n = 7) { const s = []; for (let i = 0; i < n; i++) { const t = performance.now(); fn(); s.push(performance.now() - t); } return med(s); }

const atual = time(() => { let r = prot; placeholders.forEach((orig, i) => { r = r.replace(`__STRING_${i}__`, orig); }); return r; });
const unica = time(() => prot.replace(/__STRING_(\d+)__/g, (_, i) => placeholders[Number(i)]));
console.log(`linhas=${src.split('\n').length} KB=${(src.length / 1024).toFixed(0)} strings=${placeholders.length}`);
console.log(`restauração atual (1 replace por placeholder): ${atual.toFixed(1)} ms`);
console.log(`restauração em passada única (callback)     : ${unica.toFixed(2)} ms`);

const c = new GoiasScriptCompiler();
const id = time(() => c._generateIdentifier('x.gs', src));
console.log(`_generateIdentifier(hash por split('') de ${(src.length / 1024).toFixed(0)} KB): ${id.toFixed(1)} ms (executado em TODO compile(), mesmo com JIT noop)`);
