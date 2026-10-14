'use strict';
// Desempenho do transpilador: escala (1k..40k linhas), custo por etapa, compile() vs transpile(),
// e entradas patológicas para as regexes. Somente leitura no repo.
const { performance } = require('perf_hooks');
const { SimpleTranspiler, GoiasScriptCompiler } = require('./harness');

function median(xs) {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

function timeIt(fn, runs = 5) {
  const samples = [];
  for (let i = 0; i < runs; i++) {
    const t0 = performance.now();
    fn();
    samples.push(performance.now() - t0);
  }
  return { first: samples[0], median: median(samples), min: Math.min(...samples) };
}

// Bloco realista de 15 linhas (4 strings por bloco)
function realisticBlock(i) {
  return [
    `// Bloco ${i}`,
    `faz_trem calcula${i}(a, b) {`,
    `  uai soma${i} é a mais b;`,
    `  se_ocê_quiser (soma${i} maior_que ${i}) {`,
    `    prosa("Resultado grande: " mais soma${i});`,
    `  } se_não {`,
    `    prosa("Resultado pequeno: " mais soma${i});`,
    `  }`,
    `  vai_indo (trem j é 0; j menor_que 3; j é j mais 1) {`,
    `    uai item${i} é "valor-" mais j;`,
    `    prosa(item${i});`,
    `  }`,
    `  faz_favor soma${i};`,
    `}`,
    ``,
  ].join('\n');
}

function realisticSource(targetLines) {
  const blocks = [];
  let lines = 0;
  for (let i = 0; lines < targetLines; i++) {
    blocks.push(realisticBlock(i));
    lines += 15;
  }
  return blocks.join('\n');
}

// Alta densidade de strings: 1 string por linha
function stringHeavySource(targetLines) {
  return Array.from({ length: targetLines }, (_, i) => `prosa("linha ${i}");`).join('\n');
}

const transpiler = new SimpleTranspiler();
const compiler = new GoiasScriptCompiler();

console.log('=== A) Escala: transpile() — código realista (≈4 strings / 15 linhas) ===');
console.log('linhas | KB entrada | strings | transpile mediana ms | 1ª execução ms | compile() mediana ms');
for (const target of [1000, 2000, 5000, 10000, 20000, 40000]) {
  const src = realisticSource(target);
  const lineCount = src.split('\n').length;
  const strings = (src.match(/"/g) || []).length / 2;
  const t = timeIt(() => transpiler.transpile(src));
  const c = timeIt(() => compiler.compile(src));
  console.log(`${String(lineCount).padStart(6)} | ${(src.length / 1024).toFixed(0).padStart(10)} | ${String(strings).padStart(7)} | ${t.median.toFixed(1).padStart(20)} | ${t.first.toFixed(1).padStart(14)} | ${c.median.toFixed(1).padStart(20)}`);
}

console.log('\n=== B) Escala: alta densidade de strings (1 string por linha) ===');
console.log('linhas | KB entrada | strings | transpile mediana ms');
for (const target of [1000, 2000, 5000, 10000, 20000]) {
  const src = stringHeavySource(target);
  const t = timeIt(() => transpiler.transpile(src), 3);
  console.log(`${String(target).padStart(6)} | ${(src.length / 1024).toFixed(0).padStart(10)} | ${String(target).padStart(7)} | ${t.median.toFixed(1).padStart(20)}`);
}

console.log('\n=== C) Custo isolado por etapa em 10.000 linhas realistas (estimativa por réplica fiel do algoritmo) ===');
{
  const src = realisticSource(10000);
  const stringRegex = /(['"])((?:(?!\1)[^\\]|\\.)*)(\1)/g;
  let placeholders = [];
  let protectedCode;
  const tProtect = timeIt(() => {
    placeholders = [];
    let idx = 0;
    protectedCode = src.replace(stringRegex, m => {
      const placeholder = `__STRING_${idx++}__`;
      placeholders.push({ placeholder, original: m });
      return placeholder;
    });
  });
  const tConvert = timeIt(() => transpiler._convertJSMethodsToGoiano(protectedCode));
  const tValidate = timeIt(() => transpiler._validateSyntax(src));
  const tTokens = timeIt(() => transpiler._generateTokens(src));
  const tForbidden = timeIt(() => transpiler._checkForbiddenMethods(src));
  const tRestore = timeIt(() => {
    let result = protectedCode;
    placeholders.forEach(({ placeholder, original }) => {
      result = result.replace(placeholder, original);
    });
    return result;
  });
  const tAll = timeIt(() => transpiler._applySubstitutions(src));
  console.log(`placeholders (strings) = ${placeholders.length}`);
  console.log(`proteger strings        : ${tProtect.median.toFixed(1)} ms`);
  console.log(`_convertJSMethodsToGoiano: ${tConvert.median.toFixed(1)} ms`);
  console.log(`_validateSyntax          : ${tValidate.median.toFixed(1)} ms`);
  console.log(`_generateTokens          : ${tTokens.median.toFixed(1)} ms (resultado só alimenta validate().tokens)`);
  console.log(`_checkForbiddenMethods   : ${tForbidden.median.toFixed(1)} ms`);
  console.log(`restaurar strings (loop) : ${tRestore.median.toFixed(1)} ms`);
  console.log(`_applySubstitutions total: ${tAll.median.toFixed(1)} ms`);
}

console.log('\n=== D) Entradas patológicas (tempo de transpile) ===');
function patho(label, src, runs = 1) {
  const t0 = performance.now();
  let ok = true;
  let note = '';
  try {
    const r = transpiler.transpile(src);
    ok = r.success;
    if (!ok) note = r.error && r.error.message;
  } catch (error) {
    ok = false;
    note = error.message;
  }
  const ms = performance.now() - t0;
  console.log(`${label.padEnd(58)} ${ms.toFixed(1).padStart(10)} ms  ${ok ? '' : `(falhou: ${note})`}`);
  return ms;
}
for (const n of [5000, 10000, 20000, 40000]) {
  patho(`espaços x${n} + "é" no fim (sem espaço depois)`, ' '.repeat(n) + 'é');
}
for (const n of [5000, 10000, 20000, 40000]) {
  patho(`quebras de linha x${n} + "é" no fim`, '\n'.repeat(n) + 'é');
}
for (const n of [20000, 100000]) {
  patho(`espaços x${n} puros (sem "é")`, ' '.repeat(n));
}
patho('uma aspa solta + 1 MB de texto', '"' + 'a'.repeat(1024 * 1024));
patho('1 MB de linha única "uai x é 1;"', 'uai x é 1; '.repeat(95000));
patho('20.000 aspas simples soltas (pares)', "'a ".repeat(20000));
patho('barra invertida + quebra repetidas (aspa aberta)', '"abc\\\n'.repeat(5000));
patho('aninhamento: 5000 "{" seguidos', '{'.repeat(5000));
