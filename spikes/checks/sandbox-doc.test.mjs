import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const doc = readFileSync(new URL('../../docs/fase-0/spike-sandbox.md', import.meta.url), 'utf8');
const CANDIDATES = ['worker-blob', 'worker-file', 'iframe-sandbox'];
const CRITERIA_PER_CANDIDATE = 4;

test('o relatório traz critérios, resultados, decisão e consequências', () => {
  for (const heading of ['## Critérios', '## Resultados', '## Decisão', '## Consequências para a Fase 4']) assert.ok(doc.includes(heading), heading);
});

test('a tabela cobre os 3 candidatos nos 3 navegadores', () => {
  for (const candidate of CANDIDATES) {
    const rows = doc.split('\n').filter((line) => line.startsWith(`| ${candidate} › `));
    assert.equal(rows.length, CRITERIA_PER_CANDIDATE, candidate);
    for (const row of rows) assert.match(row, /\| (passou|FALHOU) \| (passou|FALHOU) \| (passou|FALHOU) \|$/, row);
  }
});

test('o candidato escolhido passa em todos os critérios nos 3 navegadores', () => {
  const chosen = /\*\*Candidato escolhido:\*\* (worker-blob|worker-file|iframe-sandbox|nenhum)/.exec(doc)?.[1];
  assert.ok(chosen, 'linha "Candidato escolhido" ausente');
  if (chosen === 'nenhum') return assert.ok(doc.includes('**Escalado ao dono:** sim'));
  for (const row of doc.split('\n').filter((line) => line.startsWith(`| ${chosen} › `))) assert.ok(!row.includes('FALHOU'), row);
});
