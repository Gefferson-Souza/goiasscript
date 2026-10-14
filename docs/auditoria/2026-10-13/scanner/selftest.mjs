// Autoteste do scanner: fixtures pequenas com contagens conhecidas.
import assert from 'node:assert/strict';
import { analyzeFile, buildContext } from './lib/analyze-file.mjs';
import { createLexicon } from './lib/lexicon.mjs';
import { loadDeps } from './lib/load-deps.mjs';
import { evaluateFile } from './lib/rules.mjs';

const repo = '<repo>';
const deps = loadDeps(repo);
const lexicon = createLexicon();
const emptySurface = { verbatim: new Set(), apiNames: new Set(), normalized: new Set() };
let passed = 0;

function run(source, { ext = '.ts', role = 'src' } = {}) {
  const file = { rel: `fixture/sample${ext}`, abs: '', pkg: 'fixture', role, ext };
  const ctx = buildContext(file, deps, source);
  const result = analyzeFile(ctx, lexicon, emptySurface);
  return { result, evaluation: evaluateFile(result) };
}

function check(name, fn) {
  fn();
  passed += 1;
  process.stdout.write(`ok - ${name}\n`);
}

const lines = (count, body = '  noop();') => Array.from({ length: count }, () => body).join('\n');

check('função de 51 linhas é marcada e de 50 não', () => {
  const long = `function a() {\n${lines(49)}\n}`; // 51 linhas
  const exact = `function b() {\n${lines(48)}\n}`; // 50 linhas
  assert.equal(run(long).evaluation.R03.count, 1);
  assert.equal(run(exact).evaluation.R03.count, 0);
});

check('profundidade segue max-depth: else-if não soma e função reinicia', () => {
  const src = `function f(a) { if (a) { if (a) { if (a) { if (a) { if (a) { x(); } } } } } else if (a) { y(); } }`;
  const { result } = run(src);
  assert.equal(result.depth.max, 5);
  const chain = run('function g(a) { if (a) { x(); } else if (a) { y(); } else if (a) { z(); } }');
  assert.equal(chain.result.depth.max, 1);
  const nested = run('function h(a) { if (a) { items.map(() => { if (a) { w(); } }); } }');
  assert.equal(nested.result.depth.max, 1);
  assert.equal(nested.result.functions.find((fn) => fn.name === 'h').blockNesting, 3);
});

check('console conta chamadas globais e ignora binding local', () => {
  const global = run('console.log(1); console.error(2);');
  assert.equal(global.evaluation.R06.count, 2);
  const shadowed = run('function f(console) { console.log(1); }');
  assert.equal(shadowed.evaluation.R06.count, 0);
  assert.equal(run('console.log(1);', { role: 'test' }).evaluation.R06.count, 0);
});

check('any: anotação, cast e genérico', () => {
  const { evaluation } = run('const a: any = 1; const b = x as any; const c: Array<any> = [];');
  assert.equal(evaluation.R07.count, 3);
});

check('diretivas: justificadas e não justificadas', () => {
  const src = [
    '// @ts-ignore',
    'const a = 1;',
    '// @ts-expect-error: lib antiga sem tipos para este módulo',
    'const b = 2;',
    '/* eslint-disable no-console -- saída de CLI */',
    '// eslint-disable-next-line no-eval',
    'const c = 3;',
  ].join('\n');
  const { evaluation, result } = run(src);
  assert.equal(result.suppressions.tsDirectives.length, 2);
  assert.equal(evaluation.R08.count, 1);
  assert.equal(result.suppressions.eslintDisables.length, 2);
  assert.equal(evaluation.R09.count, 1);
});

check('TODO com e sem ticket', () => {
  const { evaluation, result } = run('// TODO ajustar\n// TODO(GS-12): ajustar\n// FIXME(#7): x\nconst a = 1;');
  assert.equal(result.suppressions.todos.length, 3);
  assert.equal(evaluation.R10.count, 1);
});

check('comentários: bloco longo, trailing e comentário JSX isolado', () => {
  const longBlock = ['// a', '// b', '// c', '// d', '// e', 'const x = 1;'].join('\n');
  assert.equal(run(longBlock).evaluation.R11.count, 1);
  assert.equal(run(['// a', '// b', '// c', '// d', 'const x = 1;'].join('\n')).evaluation.R11.count, 0);
  assert.equal(run('const x = 1; // lado').evaluation.R12.count, 1);
  const jsx = 'const v = (\n  <div>\n    {/* isolado */}\n    <span />\n  </div>\n);';
  assert.equal(run(jsx, { ext: '.tsx' }).evaluation.R12.count, 0);
  const jsdoc = '/**\n * linha 1\n * linha 2\n * linha 3\n * linha 4\n */\nexport function f() {}';
  assert.equal(run(jsdoc).evaluation.R11.count, 0);
  const jsdoc5 = '/**\n * 1\n * 2\n * 3\n * 4\n * 5\n */\nexport function f() {}';
  assert.equal(run(jsdoc5).evaluation.R11.count, 1);
});

check('histórico e meta-processo', () => {
  const src = [
    '// corrige o bug do gate F2',
    'const a = 1;',
    '// ordena a lista antes de renderizar',
    'const b = 2;',
    '// agora usa o cache v2',
    'const c = 3;',
    '// V8 otimiza este laço',
    'const d = 4;',
  ].join('\n');
  const { result } = run(src);
  const flagged = result.comments.history.map((h) => h.line);
  assert.deepEqual(flagged, [1, 5]);
  assert.equal(result.comments.weakHistory.length, 1);
});

check('identificadores em português por camada', () => {
  const src = 'const nome = 1; function calcularTotal(valor: number) { return valor; } const total = 2; const userName = 3;';
  const { result } = run(src);
  const names = result.identifiers.items.map((i) => i.name).sort();
  assert.deepEqual(names, ['calcularTotal', 'nome', 'valor']);
  assert.equal(run('const açúcar = 1;').result.identifiers.items.length, 1);
});

check('números mágicos: ignora constantes nomeadas, índices e radix', () => {
  const src = 'const MAX = 100; const a = x * 37; const b = list[3]; const c = parseInt(s, 10); const d = { n: 99 }; const E = { n: 5 };';
  const { evaluation } = run(src);
  assert.equal(evaluation.R15.count, 2);
});

check('strings repetidas >= 3 fora de import e chave', () => {
  const src = "import a from 'react'; const x = 'status'; const y = 'status'; const z = 'status'; const o = { 'chave': 'outra', k: 'outra' };";
  const { evaluation } = run(src);
  assert.equal(evaluation.R16.count, 1);
});

check('mutação: reatribuição, propriedade de parâmetro, let sem reatribuição e idiom de reduce', () => {
  const src = [
    'function f(a) { a = 1; }',
    'function g(o) { o.x = 1; }',
    'function h(list) { list.push(1); }',
    'const total = items.reduce((acc, c) => { acc[c] = 1; return acc; }, {});',
    'let z = 1; let w = 2; w = 3;',
    'var legacy = 1;',
    'function k(page) { page.locator("#a").fill("x"); }',
  ].join('\n');
  const { evaluation, result } = run(src);
  assert.equal(evaluation.R17.count, 1);
  assert.equal(evaluation.R18.count, 2);
  assert.equal(result.mutation.paramPropertyMutations.filter((m) => m.idiom).length, 1);
  assert.equal(result.mutation.neverReassignedLet.length, 1);
  assert.equal(result.mutation.varDeclarations.length, 1);
});

check('catch: vazio, só log, com rethrow e promise vazio', () => {
  const src = [
    'try { a(); } catch (e) {}',
    'try { a(); } catch (e) { console.error(e); }',
    'try { a(); } catch (e) { throw e; }',
    'try { a(); } catch (e) { console.error(e); return null; }',
    'p.catch(() => {});',
  ].join('\n');
  const { evaluation, result } = run(src);
  assert.equal(evaluation.R20.count, 3);
  assert.deepEqual(result.catches.swallowed.map((c) => c.kind).sort(), ['empty', 'log-only', 'promise-catch-vazio']);
});

check('código embutido em template literal é analisado à parte', () => {
  const body = Array.from({ length: 22 }, (_, i) => `function item${i}(texto) { return texto; }`).join('\n');
  const src = 'export const runtime = () => `\n' + body + '\n`;';
  const { result } = run(src);
  assert.equal(result.identifiers.embeddedBlocks.length, 1);
  assert.ok(result.identifiers.items.some((i) => i.name === 'texto' && i.embedded));
});

check('tabela nome->texto em arquivo comum não vira superfície', () => {
  const src = "const m = { sintaxe: 'a', execucao: 'b', interno: 'c', importacao: 'd', referencia: 'e' };";
  const { result } = run(src);
  const keys = result.identifiers.items.filter((i) => i.kind === 'object-key');
  assert.equal(keys.length, 5);
  assert.ok(keys.every((i) => i.surface === 'internal'));
});

check('token de uma letra acentuada é português', () => {
  const { result } = run('const é = 1; const num_é = 2;');
  assert.deepEqual(result.identifiers.items.map((i) => i.name).sort(), ['num_é', 'é']);
});

check('comentário multilinha conta uma vez e "arquivo temporário" não é pendência', () => {
  const src = ['// agora usa o cache v2', '// e mantém compatibilidade', '// com o formato antigo', 'const a = 1;', '// limpar arquivo temporário', 'const b = 2;'].join('\n');
  const { result, evaluation } = run(src);
  assert.equal(evaluation.R13.count, 1);
  assert.equal(result.comments.history[0].line, 1);
  assert.equal(result.comments.history[0].endLine, 3);
  const pending = run('// solução temporária até o ticket sair\nconst c = 1;');
  assert.equal(pending.evaluation.R13.count, 1);
});

check('R16 ignora frase de interface e especificação de placeholder', () => {
  const src = [
    "const a = 'Cola qualquer texto e o trem devolve em goianês raiz, sô.';",
    "const b = 'Cola qualquer texto e o trem devolve em goianês raiz, sô.';",
    "const c = 'Cola qualquer texto e o trem devolve em goianês raiz, sô.';",
    "const d = '<file>'; const e = '<file>'; const f = '<file>';",
    "const g = 'package.json'; const h = 'package.json'; const i = 'package.json';",
  ].join('\n');
  const { result } = run(src);
  assert.deepEqual(result.magicStrings.repeated.map((r) => r.value), ['package.json']);
});

check('R16 em TS ignora discriminante comparado; em JS mantém', () => {
  const src = "if (o.kind === 'runtime-error') {} if (o.kind === 'runtime-error') {} if (o.kind === 'runtime-error') {}";
  assert.equal(run(src, { ext: '.ts' }).result.magicStrings.repeated.length, 0);
  assert.equal(run(src, { ext: '.js' }).result.magicStrings.repeated.length, 1);
});

check('R21 pega rótulo/narração curta e poupa justificativa e bloco vazio', () => {
  const src = [
    'function f(a) {',
    '  // Mostrar warnings',
    '  g(a);',
    '  // Evita pendurar o Worker se travar',
    '  h(a);',
    '  try { x(); } catch { /* clipboard indisponível */ }',
    '  // Esta linha tem mais de sete palavras narrando o que o código está fazendo agora',
    '  k(a);',
    '}',
  ].join('\n');
  const { result } = run(src);
  assert.deepEqual(result.comments.narrations.map((n) => n.line), [2]);
});

check('R13 pega roadmap "para futuro"', () => {
  assert.equal(run('// Modificadores (para futuro)\nconst a = 1;').evaluation.R13.count, 1);
});

process.stdout.write(`\n${passed} verificações passaram.\n`);
