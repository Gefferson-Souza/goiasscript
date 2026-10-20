import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const doc = readFileSync(new URL('../../docs/fase-0/publicacao-extensao.md', import.meta.url), 'utf8');
const METHODS = ['Entra ID federado (--azure-credential)', 'vsce --oidc', 'nenhum (escalado ao dono)'];
const ACTIONS_RUN_URL = /https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/actions\/runs\/(?!0+\b)\d+/;

test('o documento traz decisão, evidências, prazo e a entrada do ADR-0009', () => {
  for (const heading of ['## Decisão', '## Evidências', '## Prazo e fallback', '## Entrada para o ADR-0009']) assert.ok(doc.includes(heading), heading);
  assert.ok(doc.includes('2026-12-01'), 'prazo dos PATs');
  assert.ok(/Open VSX/.test(doc) && /escopo/i.test(doc), 'token restrito do Open VSX');
});

test('a decisão é um dos métodos permitidos e vem com a execução real que a prova', () => {
  const method = /\*\*Método escolhido:\*\* (.+)/.exec(doc)?.[1]?.trim();
  assert.ok(METHODS.includes(method ?? ''), `método inválido: ${method}`);
  if (method !== 'nenhum (escalado ao dono)') assert.match(doc, ACTIONS_RUN_URL);
});
