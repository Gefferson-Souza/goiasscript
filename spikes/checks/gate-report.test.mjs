import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const report = read('docs/fase-0/relatorio-gate.md');
const measured = JSON.parse(read('docs/fase-0/medicao-poc.json'));
const projection = JSON.parse(read('docs/fase-0/projecao.json'));
const HOURS_PER_DAY = 6;
const hours = [...read('docs/fase-0/horas.md').matchAll(/^\| U0-0[2-5] \| (\d+(?:[.,]\d+)?) h \|$/gm)].reduce((sum, row) => sum + Number(row[1].replace(',', '.')), 0);

// Fórmula do ADR-0001: (L_fase2 / P) × fator, com P = linhas do PoC por dia de 6 horas.
function projectedDays() {
  const fromBasis = (item) => item.basis.reduce((total, file) => total + (measured.files[file] ?? 0), 0) * item.factor;
  const phase2Lines = projection.items.reduce((total, item) => total + (item.lines ?? fromBasis(item)), 0);
  return (phase2Lines / ((measured.sourceLines + measured.tableLines) / (hours / HOURS_PER_DAY))) * projection.pipelineFactor;
}

const rows = Object.fromEntries([...report.matchAll(/^\| ([a-f]-[\w-]+) \|.*\| (passou|FALHOU|bloqueia) \|$/gm)].map((row) => [row[1], row[2]]));
const verdict = /\*\*Veredito:\*\* (segue|para-e-leva-ao-dono)/.exec(report)?.[1];

test('o relatório traz os 8 critérios e as horas de U0-02 a U0-05', () => {
  assert.deepEqual(Object.keys(rows).sort(), ['a-linhas', 'a-tamanho', 'b-tempo', 'c-demos', 'c-erros-tipicos', 'd-diagnosticos', 'e-rfc', 'f-projecao']);
  assert.ok(hours > 0, 'horas.md sem horas de U0-02 a U0-05');
});

test('os critérios a, b e f do relatório batem com a medição e com a fórmula do ADR-0001', () => {
  const { limits } = measured;
  const expected = {
    'a-linhas': measured.sourceLines <= limits.maxSourceLines,
    'a-tamanho': measured.brotliBytes <= limits.maxBrotliBytes,
    'b-tempo': measured.node.startsWith('v24.') && measured.medianMs <= limits.maxMillisecondsFor10kLines,
    'f-projecao': projectedDays() <= limits.maxProjectedDays,
  };
  for (const [id, passed] of Object.entries(expected)) assert.equal(rows[id] === 'passou', passed, id);
});

test('falhou critério técnico ou RFC sem aprovação: para e leva ao dono, sem plano B automático', () => {
  const allPassed = Object.values(rows).every((result) => result === 'passou');
  assert.equal(verdict, allPassed ? 'segue' : 'para-e-leva-ao-dono');
  assert.ok(report.includes('Não há plano B automático'));
  assert.ok(report.includes('**Decisão do dono**'));
});
