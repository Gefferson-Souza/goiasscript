'use strict';
// Processo-filho: roda UM cenário em UM modo. Uso: node --allow-natives-syntax bench-child.js <cenario> <plain|goiano>
// plain  = JS nativo, sem runtime (o que o usuário escreveria em JS puro)
// goiano = com o runtime injetado (indirect eval no escopo global) e chamando os aliases como o transpilador emite
const { RUNTIME } = require('./harness');
const [, , scenario, mode] = process.argv;

if (mode === 'goiano') (0, eval)(RUNTIME);
// runtime dentro de "use strict" (como no Worker do playground: new Function('"use strict"; ' + js))
if (mode === 'goiano_strict') new Function('"use strict"; ' + RUNTIME)();

const N = 2_000_000;
const arr = [1, 2, 3, 4, 5, 6, 7, 8];
const str = 'abcabcabcabc';
let sink = 0;

const cbs = [x => x + 1, x => x * 2, x => x - 3, x => x ^ 1, x => x | 2, x => x & 7];
const reducers = [(a, b) => a + b, (a, b) => a * b % 1000, (a, b) => a - b, (a, b) => a ^ b];

const S = {
  length: {
    plain: () => { let s = 0; for (let i = 0; i < N * 5; i++) s += arr.length; return s; },
    goiano: () => { let s = 0; for (let i = 0; i < N * 5; i++) s += arr.tamanho(); return s; },
  },
  floor: {
    plain: () => { let s = 0; for (let i = 0; i < N * 5; i++) s += Math.floor(i / 3); return s; },
    goiano: () => { let s = 0; for (let i = 0; i < N * 5; i++) s += GoianoMath.arredondar_baixo(i / 3); return s; },
  },
  map: {
    plain: () => { let s = 0; for (let i = 0; i < N / 4; i++) s += arr.map(cbs[i % 6]).length; return s; },
    goiano: () => { let s = 0; for (let i = 0; i < N / 4; i++) s += arr.mapear(cbs[i % 6]).length; return s; },
  },
  reduce: {
    plain: () => { let s = 0; for (let i = 0; i < N / 4; i++) s += arr.reduce(reducers[i % 4], 1); return s; },
    goiano: () => { let s = 0; for (let i = 0; i < N / 4; i++) s += arr.reduzir(reducers[i % 4], 1); return s; },
  },
  push: {
    plain: () => { let s = 0; for (let i = 0; i < N / 10; i++) { const a = []; for (let j = 0; j < 10; j++) a.push(j); s += a.length; } return s; },
    goiano: () => { let s = 0; for (let i = 0; i < N / 10; i++) { const a = []; for (let j = 0; j < 10; j++) a.empurrar(j); s += a.length; } return s; },
  },
  includes: {
    plain: () => { let s = 0; for (let i = 0; i < N; i++) s += str.includes('ca') ? 1 : 0; return s; },
    goiano: () => { let s = 0; for (let i = 0; i < N; i++) s += str.contem('ca') ? 1 : 0; return s; },
  },
  includes_vary: {
    plain: () => { const needles = ['ca', 'bc', 'zz', 'ab', 'cc', 'xy', 'ba', 'cb']; let s = 0; for (let i = 0; i < N; i++) s += str.includes(needles[i & 7]) ? 1 : 0; return s; },
    goiano: () => { const needles = ['ca', 'bc', 'zz', 'ab', 'cc', 'xy', 'ba', 'cb']; let s = 0; for (let i = 0; i < N; i++) s += str.contem(needles[i & 7]) ? 1 : 0; return s; },
  },
  upper_trim: {
    plain: () => { let s = 0; for (let i = 0; i < N / 2; i++) s += ('  ab' + (i & 3) + ' ').trim().toUpperCase().length; return s; },
    goiano: () => { let s = 0; for (let i = 0; i < N / 2; i++) s += ('  ab' + (i & 3) + ' ').aparar().pra_maiusculo().length; return s; },
  },
  replace: {
    plain: () => { let s = 0; for (let i = 0; i < N / 10; i++) s += str.replaceAll('a', 'x').length; return s; },
    goiano: () => { let s = 0; for (let i = 0; i < N / 10; i++) s += str.trocar('a', 'x').length; return s; },
  },
  forin: {
    plain: () => { const o = { a: 1, b: 2, c: 3 }; let s = 0; for (let i = 0; i < N / 3; i++) for (const k in o) s += k.length; return s; },
    goiano: () => { const o = { a: 1, b: 2, c: 3 }; let s = 0; for (let i = 0; i < N / 3; i++) for (const k in o) s += k.length; return s; },
  },
  forin_array_small_objects: {
    plain: () => { let s = 0; for (let i = 0; i < N / 4; i++) { const o = { x: i, y: 2 }; for (const k in o) s += k.length; } return s; },
    goiano: () => { let s = 0; for (let i = 0; i < N / 4; i++) { const o = { x: i, y: 2 }; for (const k in o) s += k.length; } return s; },
  },
};

const fn = S[scenario][mode === 'goiano_strict' ? 'goiano' : mode];
const times = [];
for (let r = 0; r < 7; r++) {
  const t0 = process.hrtime.bigint();
  sink += fn();
  times.push(Number(process.hrtime.bigint() - t0) / 1e6);
}
times.sort((a, b) => a - b);
const info = { scenario, mode, minMs: +times[0].toFixed(1), medianMs: +times[3].toFixed(1), sink: sink > 0 };
if (scenario === 'proto_status') info.extra = 'n/a';
console.log(JSON.stringify(info));
