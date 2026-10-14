#!/usr/bin/env node
// Gera as tabelas markdown do relatório a partir dos JSONs do scanner e da validação.
// Uso: node report-tables.mjs > out/report-tables.md
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PACKAGE_ORDER } from './lib/aggregate.mjs';
import { RULES, evaluateFile } from './lib/rules.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const read = (rel) => JSON.parse(fs.readFileSync(path.join(HERE, rel), 'utf8'));
const scan = read('scan-result.json');
const summary = read('scan-summary.json');
const fp = read('validate/fp-rates.json');
const census = read('validate/census-r21.json');
const eslintCross = read('out/eslint-crosscheck.json');
const eslintRun = read('out/eslint-gate-run.json');
const policy = read('gate/policy.json');

const packages = PACKAGE_ORDER.filter((pkg) => summary.packages[pkg]);
const pct = (part, whole) => (whole === 0 ? '0.0%' : `${((part / whole) * 100).toFixed(1)}%`);
const sum = (values) => values.reduce((total, value) => total + value, 0);
const table = (headers, rows) => {
  const line = (cells) => `| ${cells.join(' | ')} |`;
  return [line(headers), line(headers.map(() => '---')), ...rows.map(line)].join('\n');
};
const section = (title) => process.stdout.write(`\n\n## ${title}\n\n`);
const emit = (text) => process.stdout.write(`${text}\n`);

section('T1 Métricas por pacote');
emit(
  table(
    ['Pacote', 'Arquivos', 'Linhas', 'Linhas de código', 'Funções', 'Arquivos sem violação'],
    packages.map((pkg) => {
      const files = scan.files.filter((f) => f.pkg === pkg);
      const clean = files.filter((f) => summary.evaluations[f.file] && Object.values(summary.evaluations[f.file]).every((n) => n === 0)).length;
      return [pkg, files.length, sum(files.map((f) => f.size.lines)), sum(files.map((f) => f.size.codeLines)), sum(files.map((f) => f.functions.length)), `${clean}/${files.length}`];
    }),
  ),
);
emit(`\nTotal: ${summary.total.files} arquivos, ${summary.total.lines} linhas, ${summary.total.codeLines} de código, ${summary.total.misc.functionsTotal} funções.`);

section('T2 Regra x pacote (ocorrências (arquivos afetados/aplicáveis))');
const cell = (entry) => (!entry || entry.filesApplicable === 0 ? '–' : `${entry.occurrences} (${entry.filesAffected}/${entry.filesApplicable})`);
emit(
  table(
    ['Regra', 'Descrição', ...packages, 'Total', 'Conformes'],
    RULES.map((rule) => [rule.id, rule.title, ...packages.map((pkg) => cell(summary.packages[pkg].rules[rule.id])), cell(summary.total.rules[rule.id]), `${summary.conformance[rule.id].pct}%`]),
  ),
);
const overall = summary.overall;
emit(`\nArquivos sem nenhuma violação: ${overall.filesFullyConformant}/${overall.files}. Conformes nas regras do hook (R06 R07 R08 R09 R10 R14): ${overall.filesConformantHookRules}/${overall.files}. Conformes nas regras de tamanho (R01 a R05): ${overall.filesConformantSizeRules}/${overall.files}. Células arquivo x regra conformes: ${overall.cellConformancePct}%. Ocorrências totais: ${overall.totalOccurrences}.`);

section('T3 Top 20 piores arquivos');
emit(table(['#', 'Arquivo', 'Linhas', 'Índice', 'Ocorrências por regra'], summary.topFiles.map((entry, i) => [i + 1, `\`${entry.file}\``, entry.lines, `${entry.score}%`, Object.entries(entry.counts).map(([id, n]) => `${id}:${n}`).join(' ')])));

section('T4 Top 20 maiores funções');
emit(table(['#', 'Local', 'Função', 'Linhas', 'Sem JSX/template', 'Linhas de código', 'Tipo', 'Aninhamento'], summary.topFunctions.map((fn, i) => [i + 1, `\`${fn.file}:${fn.line}\``, fn.name, fn.lines, fn.adjustedLines, fn.codeLines, fn.testContainer ? 'describe' : fn.kind, fn.blockNesting])));

section('T5 Sensibilidade do R03 (funções acima de 50 linhas)');
const allFns = scan.files.flatMap((f) => f.functions.map((fn) => ({ ...fn, file: f.file })));
const countBy = (predicate) => allFns.filter(predicate).length;
emit(
  table(
    ['Definição', 'Funções', 'Arquivos'],
    [
      ['linhas brutas, incluindo callbacks de describe (ESLint max-lines-per-function padrão)', countBy((fn) => fn.lines > 50), new Set(allFns.filter((fn) => fn.lines > 50).map((fn) => fn.file)).size],
      ['linhas brutas, excluindo describe (definição do scanner, R03)', countBy((fn) => fn.lines > 50 && !fn.testContainer), new Set(allFns.filter((fn) => fn.lines > 50 && !fn.testContainer).map((fn) => fn.file)).size],
      ['descontando JSX e template literal', countBy((fn) => fn.lines - fn.jsxLines - fn.templateLines > 50 && !fn.testContainer), new Set(allFns.filter((fn) => fn.lines - fn.jsxLines - fn.templateLines > 50 && !fn.testContainer).map((fn) => fn.file)).size],
      ['só linhas de código (sem brancos e sem comentários)', countBy((fn) => fn.codeLines > 50 && !fn.testContainer), new Set(allFns.filter((fn) => fn.codeLines > 50 && !fn.testContainer).map((fn) => fn.file)).size],
      ['limite 100 linhas brutas', countBy((fn) => fn.lines > 100 && !fn.testContainer), new Set(allFns.filter((fn) => fn.lines > 100 && !fn.testContainer).map((fn) => fn.file)).size],
    ],
  ),
);

section('T6 R06 console.* fora de testes por categoria');
const consoleCategory = (file) => {
  if (file.file.startsWith('packages/core/bin/')) return 'bin (CLI e REPL)';
  if (file.file.startsWith('packages/core/src/cli/')) return 'src/cli';
  if (file.file.startsWith('apps/playground/scripts/')) return 'script de build';
  if (file.file.startsWith('vscode-extension/')) return 'extensão VS Code';
  if (file.file.startsWith('apps/engoianador-api/')) return 'Worker (servidor)';
  if (file.file.startsWith('apps/playground/')) return 'UI do playground';
  return 'biblioteca core';
};
const byCategory = {};
for (const file of scan.files) {
  if (file.isTest) continue;
  const key = consoleCategory(file);
  byCategory[key] ??= { total: 0, files: 0, methods: {} };
  if (file.consoleCalls.length) byCategory[key].files += 1;
  byCategory[key].total += file.consoleCalls.length;
  for (const call of file.consoleCalls) byCategory[key].methods[call.method] = (byCategory[key].methods[call.method] ?? 0) + 1;
}
emit(table(['Categoria', 'Chamadas', 'Arquivos', 'Métodos'], Object.entries(byCategory).filter(([, v]) => v.total > 0).sort((a, b) => b[1].total - a[1].total).map(([k, v]) => [k, v.total, v.files, Object.entries(v.methods).map(([m, n]) => `${m}:${n}`).join(' ')])));

section('T7 R14 identificadores em português');
const idItems = scan.files.flatMap((f) => f.identifiers.items.map((i) => ({ ...i, file: f.file, pkg: f.pkg, role: f.role, isTest: f.isTest })));
const counted = idItems.filter((i) => i.surface !== 'surface-exact' && i.tier !== 'domain');
const classOf = (i) => (i.surface === 'surface-mirror' ? 'espelho de comando' : i.embedded ? 'interno no runtime embutido' : 'interno');
const declared = sum(scan.files.map((f) => f.identifiers.declaredTotal));
emit(
  table(
    ['Categoria', 'Ocorrências', 'Nomes distintos', 'Conta no R14?'],
    [
      ['interno (declarado no código do projeto)', counted.filter((i) => classOf(i) === 'interno').length, new Set(counted.filter((i) => classOf(i) === 'interno').map((i) => i.name)).size, 'sim'],
      ['espelho de comando (método interno com o nome do comando)', counted.filter((i) => classOf(i) === 'espelho de comando').length, new Set(counted.filter((i) => classOf(i) === 'espelho de comando').map((i) => i.name)).size, 'sim'],
      ['interno no runtime embutido (parâmetros no template literal)', counted.filter((i) => classOf(i) === 'interno no runtime embutido').length, new Set(counted.filter((i) => classOf(i) === 'interno no runtime embutido').map((i) => i.name)).size, 'sim'],
      ['superfície exata da linguagem (keywords, métodos e globais do runtime)', idItems.filter((i) => i.surface === 'surface-exact' && i.tier !== 'domain').length, new Set(idItems.filter((i) => i.surface === 'surface-exact' && i.tier !== 'domain').map((i) => i.name)).size, 'não (superfície)'],
      ['nome próprio do produto (Goiano, Engoiana)', idItems.filter((i) => i.tier === 'domain').length, new Set(idItems.filter((i) => i.tier === 'domain').map((i) => i.name)).size, 'não (domínio)'],
    ],
  ),
);
emit(`\nIdentificadores declarados no total: ${declared} (inclui ${sum(scan.files.map((f) => f.identifiers.declaredEmbedded))} do runtime embutido). R14 conta ${counted.length} (${pct(counted.length, declared)}), ${new Set(counted.map((i) => i.name)).size} nomes distintos.`);
emit('\nPor pacote:\n');
emit(table(['Pacote', 'R14 (ocorrências)', 'Declarados', '% dos declarados', 'Em testes'], packages.map((pkg) => {
  const own = counted.filter((i) => i.pkg === pkg);
  const total = sum(scan.files.filter((f) => f.pkg === pkg).map((f) => f.identifiers.declaredTotal));
  return [pkg, own.length, total, pct(own.length, total), own.filter((i) => i.isTest).length];
})));
emit('\nPor tipo de declaração:\n');
const kinds = {};
for (const i of counted) kinds[i.kind] = (kinds[i.kind] ?? 0) + 1;
emit(table(['Tipo', 'Ocorrências'], Object.entries(kinds).sort((a, b) => b[1] - a[1]).map(([k, n]) => [k, n])));
emit('\nNomes mais frequentes:\n');
const names = {};
for (const i of counted) names[i.name] = (names[i.name] ?? 0) + 1;
emit(table(['Nome', 'Ocorrências'], Object.entries(names).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 12).map(([k, n]) => [k, n])));
const accentCounted = counted.filter((i) => /[áàâãäéèêëíìîïóòôõöúùûüçñ]/i.test(i.name));
emit(`\nSubconjunto sem falso positivo possível (nome com acento, detectável por id-match): ${accentCounted.length} de ${counted.length} (${pct(accentCounted.length, counted.length)}) ocorrências contadas: ${[...new Set(accentCounted.map((i) => i.name))].join(', ')}.`);

section('T8 Comentários');
const c = summary.total.comments;
emit(table(['Métrica', 'Valor'], [
  ['registros de comentário (nós do parser)', c.total],
  ['comentários lógicos (linhas // consecutivas contam uma vez)', c.prose],
  ['diretivas (eslint, ts)', c.directives],
  ['idioma pt / en / indeterminado', `${c.languages.pt} / ${c.languages.en} / ${c.languages.unk}`],
  ['JSDoc', c.jsdoc],
  ['JSDoc em membro privado (@private ou _nome)', c.jsdocPrivate],
  ['linhas de comentário / linhas de código', `${c.commentLines} / ${c.codeLines} (${c.commentToCodePct}%)`],
  ['candidatos fracos de histórico (palavras antes/agora soltas), não contados', c.weakHistoryCandidates],
]));
emit('\nR21 por pacote:\n');
emit(table(['Pacote', 'R21', 'Comentários lógicos', '% que só rotula/narra'], packages.map((pkg) => {
  const own = scan.files.filter((f) => f.pkg === pkg);
  const n21 = sum(own.map((f) => f.comments.narrations.length));
  const prose = sum(own.map((f) => f.comments.prose));
  return [pkg, n21, prose, pct(n21, prose)];
})));

section('T9 Verificação cruzada com ESLint (implementação independente)');
const crossRows = [];
const countFor = (key) => Object.values(eslintCross.results[key] ?? {}).reduce((total, list) => total + list.length, 0);
const filesFor = (key) => Object.values(eslintCross.results[key] ?? {}).filter((list) => list.length).length;
const scannerCount = (id) => summary.total.rules[id];
crossRows.push(['R01', 'max-lines 400', scannerCount('R01').occurrences, countFor('R01'), 'mesmos 4 arquivos']);
crossRows.push(['R02', 'max-lines 800', scannerCount('R02').occurrences, countFor('R02'), 'igual']);
crossRows.push(['R03', 'max-lines-per-function 50', `${allFns.filter((fn) => fn.lines > 50).length} (com describe)`, countFor('R03'), 'mesmas 25 funções']);
crossRows.push(['R04', 'max-depth 4', scannerCount('R04').occurrences, countFor('R04'), 'igual']);
crossRows.push(['R06', 'no-console', scannerCount('R06').occurrences, countFor('R06'), 'mesmas 180 linhas']);
crossRows.push(['R07', '@typescript-eslint/no-explicit-any', scannerCount('R07').occurrences, countFor('R07'), 'mesmas 3 linhas']);
crossRows.push(['R08', '@typescript-eslint/ban-ts-comment', scannerCount('R08').occurrences, countFor('R08'), 'igual']);
crossRows.push(['R09', 'eslint-comments/require-description', scannerCount('R09').occurrences, countFor('R09'), 'mesmas 2 linhas']);
crossRows.push(['R10', 'no-warning-comments (location: start)', scannerCount('R10').occurrences, countFor('R10'), 'igual; com location anywhere dá 8 falsos positivos em "mé-todo"']);
crossRows.push(['R12', 'no-inline-comments', scannerCount('R12').occurrences, countFor('R12'), 'mesmas 6 linhas']);
crossRows.push(['R14', 'id-match (só diacríticos)', accentCounted.length, countFor('R14d'), 'ESLint não olha nomes de método de classe e conta atribuições repetidas']);
crossRows.push(['R15', 'no-magic-numbers (detectObjects)', scannerCount('R15').occurrences, countFor('R15'), 'ESLint acusa um 60 dentro de const nomeada']);
crossRows.push(['R17', 'no-param-reassign (props:false)', scannerCount('R17').occurrences, countFor('R17'), 'igual']);
crossRows.push(['R18', 'no-param-reassign (props:true)', scannerCount('R18').occurrences, countFor('R18'), 'ESLint não vê .push em parâmetro']);
crossRows.push(['R19', 'prefer-const + no-var', scannerCount('R19').occurrences, countFor('R19a') + countFor('R19b'), 'igual']);
crossRows.push(['R20', 'no-empty / no-restricted-syntax', scannerCount('R20').occurrences, `${countFor('R20')} / ${countFor('R20s')}`, 'complementares']);
emit(table(['Regra', 'ESLint equivalente', 'Scanner', 'ESLint', 'Observação'], crossRows));
emit(`\nESLint ${eslintCross.eslintVersion}, typescript-eslint ${eslintCross.tsEslintVersion}; erros fatais de parsing: ${eslintCross.fatalParses.length}.`);

section('T10 Validação manual');
const pctf = (v) => `${(v * 100).toFixed(1)}%`;
const fpRows = fp.rows.filter((row) => !row.exclusion).map((row) => [row.group, row.population, row.n, row.TP, row['TP-fraco'], row.FP, pctf(row.rate), row.census ? 'censo' : `${pctf(row.low)}–${pctf(row.high)}`, pctf(row.noise)]);
emit(table(['Grupo', 'População', 'Amostra', 'TP', 'TP-fraco', 'FP', 'Taxa de FP', 'IC 95%', 'Ruído (FP+fraco)'], fpRows));
emit('\n');
emit(table(['Estrato de exclusão', 'População', 'Amostra', 'TN', 'TN?', 'FN', 'Exclusão indevida'], fp.rows.filter((row) => row.exclusion).map((row) => [row.group, row.population, row.n, row.TN, row['TN?'], row.FN, `${pctf(row.rate)} (IC ${pctf(row.low)}–${pctf(row.high)})`])));
emit(`\nR14 contado: população ${fp.r14Aggregate.population}, amostra ${fp.r14Aggregate.sampled}, FP ${pctf(fp.r14Aggregate.fpRateStratified)} (IC ${pctf(fp.r14Aggregate.ci.low)}–${pctf(fp.r14Aggregate.ci.high)}).`);
emit(`R21 (censo visual de ${scan.files.reduce((n, f) => n + f.comments.narrations.length, 0)} itens): FP ${census.fp.length}, TP-fraco ${census.fraco.length}, TP ${scan.files.reduce((n, f) => n + f.comments.narrations.length, 0) - census.fp.length - census.fraco.length}.`);

section('T11 Matriz de conformidade (regra x situação)');
const evaluated = scan.files.map((file) => ({ file, evaluation: evaluateFile(file) }));
const symbolFor = (affectedPct, occurrences) => (occurrences === 0 ? 'conforme' : affectedPct > 15 ? 'não conforme' : 'parcial');
emit(
  table(
    ['Regra', 'Situação', 'Ocorrências', 'Arquivos afetados', 'Exemplo'],
    RULES.map((rule) => {
      const cellInfo = summary.total.rules[rule.id];
      const affectedPct = cellInfo.filesApplicable ? (cellInfo.filesAffected / cellInfo.filesApplicable) * 100 : 0;
      const worst = evaluated
        .filter((entry) => entry.evaluation[rule.id].count > 0)
        .sort((a, b) => b.evaluation[rule.id].count - a.evaluation[rule.id].count)[0];
      const sampleItem = worst?.evaluation[rule.id].items[0];
      const example = worst ? `\`${worst.file.file}:${sampleItem.line}\`` : '–';
      return [rule.id, symbolFor(affectedPct, cellInfo.occurrences), cellInfo.occurrences, `${cellInfo.filesAffected}/${cellInfo.filesApplicable} (${affectedPct.toFixed(1)}%)`, example];
    }),
  ),
);

section('T12 Densidade por pacote');
const totalOcc = summary.overall.totalOccurrences;
emit(
  table(
    ['Pacote', 'Ocorrências', '% do total', 'Linhas de código', '% das linhas de código', 'Ocorrências por 100 linhas de código'],
    packages.map((pkg) => {
      const occ = sum(RULES.map((rule) => summary.packages[pkg].rules[rule.id].occurrences));
      const code = summary.packages[pkg].codeLines;
      return [pkg, occ, pct(occ, totalOcc), code, pct(code, summary.total.codeLines), ((occ / code) * 100).toFixed(1)];
    }),
  ),
);

section('T13 Política de severidade do gate');
emit(table(['Regra', 'Severidade', 'Motivo (ruído medido)'], RULES.map((rule) => {
  const row = fp.rows.find((r) => r.group === rule.id);
  const noise = row ? `FP ${(row.rate * 100).toFixed(1)}%, ruído ${(row.noise * 100).toFixed(1)}%${row.census ? ' (censo)' : ''}` : rule.id === 'R14' ? 'FP 0%, ruído 0% nas 23 amostras' : 'sem ocorrências ou não amostrada';
  return [rule.id, policy.severity[rule.id], noise];
})));
emit(`\nExceção de caminho: ${policy.overrides.map((o) => `${Object.keys(o.severity).join(',')} vira ${Object.values(o.severity).join(',')} em ${o.pathPrefixes.join(', ')}`).join('; ')}.`);

section('T14 Custo de adoção da config ESLint do gate (ESLint do repo)');
emit(table(['Regra ESLint', 'Erros', 'Avisos', 'Arquivos'], Object.entries(eslintRun.rules).sort().map(([rule, v]) => [rule, v.error, v.warn, v.files])));
emit(`\nTotal hoje: ${eslintRun.errors} erros e ${eslintRun.warnings} avisos (ESLint ${eslintRun.eslint}; erros fatais de parsing: ${eslintRun.fatal}).`);

section('T15 Exemplos validados à mão (um por heurística e por tipo de veredicto)');
const sampleItems = read('validate/sample.json');
const verdictMap = read('validate/verdicts.json');
const keyOfItem = (item) => `${item.rule}|${item.file}|${item.line}|${item.text.slice(0, 40)}`;
const EXAMPLES = [
  ['R01', 'packages/core/bin/goiasscript.js', 1], ['R03', 'apps/engoianador-api/src/index.ts', 47], ['R03', 'apps/playground/components/Toolbar.tsx', 13],
  ['R05', 'packages/core/bin/goiasscript.js', 162], ['R06', 'vscode-extension/src/extension.js', 54], ['R06', 'packages/core/bin/goiasscript.js', 52],
  ['R07', 'apps/playground-e2e/tests/security.spec.ts', 26], ['R09', 'packages/core/src/compiler.js', 298], ['R11', 'apps/playground/workers/runner.worker.ts', 44],
  ['R12', 'apps/engoianador-api/src/rate-limit.ts', 8], ['R13', 'packages/core/src/compiler/simpleTranspiler.js', 352], ['R13', 'packages/core/src/browser.js', 1],
  ['R14', 'packages/core/src/errors/ErroGoiano.js', 83], ['R14', 'vscode-extension/src/extension.js', 78], ['R14', 'packages/core/src/goianoMethods/GoianoBuiltins.js', 148],
  ['R14', 'packages/core/bin/goiasscript.js', 99], ['R14', 'packages/core/src/compiler/lexer.js', 63], ['R14', 'apps/playground/components/ShareCard.tsx', 4],
  ['R15', 'apps/engoianador-api/src/index.ts', 82], ['R15', 'apps/playground/app/opengraph-image.tsx', 47], ['R16', 'packages/core/bin/goiasscript.js', 182],
  ['R16', 'packages/core/src/cli/index.js', 106], ['R16', 'apps/playground/app/opengraph-image.tsx', 16], ['R18', 'apps/playground/workers/runner.worker.ts', 33],
  ['R18', 'vscode-extension/src/extension.js', 96], ['R20', 'packages/core/src/cli/index.js', 139], ['R20', 'packages/core/bin/goias.js', 89],
  ['R20', 'apps/engoianador-api/src/rate-limit.ts', 23], ['R21', 'packages/core/bin/goias.js', 124], ['R21', 'apps/playground-e2e/tests/home.spec.ts', 9],
];
const exampleRows = EXAMPLES.map(([rule, file, line]) => {
  const item = sampleItems.find((entry) => entry.rule === rule && entry.file === file && entry.line === line);
  const verdict = item ? verdictMap[keyOfItem(item)] : null;
  const shortText = item ? item.text.replace(/\|/g, '/').slice(0, 58) : '(fora da amostra)';
  return [rule, `\`${file}:${line}\``, shortText, verdict ? verdict.v : '?', verdict ? verdict.n.replace(/\|/g, '/') : ''];
});
emit(table(['Regra', 'Local', 'Achado do scanner', 'Veredicto', 'Justificativa'], exampleRows));
emit(`\nTotal de itens com veredicto manual: ${Object.keys(verdictMap).length}.`);
