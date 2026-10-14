import { PACKAGE_ORDER } from './aggregate.mjs';
import { RULES } from './rules.mjs';

function cell(entry) {
  if (!entry || entry.filesApplicable === 0) return '–';
  return `${entry.occurrences} (${entry.filesAffected}/${entry.filesApplicable})`;
}

function table(headers, rows) {
  const line = (cells) => `| ${cells.join(' | ')} |`;
  return [line(headers), line(headers.map(() => '---')), ...rows.map(line)].join('\n');
}

function ruleTable(summary) {
  const packages = PACKAGE_ORDER.filter((pkg) => summary.packages[pkg]);
  const rows = RULES.map((rule) => [
    rule.id,
    rule.title,
    ...packages.map((pkg) => cell(summary.packages[pkg].rules[rule.id])),
    cell(summary.total.rules[rule.id]),
    `${summary.conformance[rule.id].pct}%`,
  ]);
  return table(['Regra', 'Descrição', ...packages, 'Total', 'Arquivos conformes'], rows);
}

function topFilesTable(summary) {
  const rows = summary.topFiles.map((entry, index) => [
    index + 1,
    `\`${entry.file}\``,
    entry.lines,
    `${entry.score}%`,
    Object.entries(entry.counts).map(([id, count]) => `${id}:${count}`).join(' '),
  ]);
  return table(['#', 'Arquivo', 'Linhas', 'Índice', 'Ocorrências por regra'], rows);
}

function topFunctionsTable(summary) {
  const rows = summary.topFunctions.map((fn, index) => [
    index + 1,
    `\`${fn.file}:${fn.line}\``,
    fn.name,
    fn.lines,
    fn.adjustedLines,
    fn.testContainer ? 'describe' : fn.kind,
  ]);
  return table(['#', 'Local', 'Função', 'Linhas', 'Ajustadas (sem JSX/template)', 'Tipo'], rows);
}

export function renderSummaryMarkdown(summary) {
  const { overall, meta } = summary;
  return [
    '# Resumo agregado do scanner de conformidade',
    '',
    `Commit auditado: \`${meta.git.head}\` (${meta.git.branch}). Arquivos analisados: ${meta.filesScanned}.`,
    `Células da tabela: ocorrências (arquivos afetados/arquivos aplicáveis).`,
    '',
    '## Regra por pacote',
    '',
    ruleTable(summary),
    '',
    `Arquivos sem nenhuma violação: ${overall.filesFullyConformant}/${overall.files}. ` +
      `Conformidade média por célula arquivo×regra: ${overall.cellConformancePct}%.`,
    '',
    '## Piores arquivos',
    '',
    topFilesTable(summary),
    '',
    '## Maiores funções',
    '',
    topFunctionsTable(summary),
    '',
  ].join('\n');
}
