import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const adr = readFileSync(new URL('../../docs/adr/0001-front-end-proprio-a-mao.md', import.meta.url), 'utf8');
const flat = adr.replace(/\s+/g, ' ');
const LIMITS = { maxSourceLines: 1500, maxBrotliBytes: 29696, maxMillisecondsFor10kLines: 150, maxProjectedDays: 28 };

test('o ADR-0001 grava os limites a priori no bloco json', () => {
  const block = /```json limits\n([\s\S]*?)\n```/.exec(adr)?.[1];
  assert.deepEqual(JSON.parse(block ?? 'null'), LIMITS);
});

test('o ADR-0001 define medição, projeção e a regra sem plano B antes de medir', () => {
  for (const text of ['Node 24', 'mediana de 20 execuções depois de 2 de aquecimento', 'brotli', '× 1,3', 'não existe plano B automático', '**Status:** proposto']) {
    assert.ok(flat.includes(text), text);
  }
});
