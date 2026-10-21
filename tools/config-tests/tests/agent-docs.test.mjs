import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { findAgentDocProblems } from '../../../scripts/agent-docs.ts';

const CLAUDE_DOC = 'CLAUDE.md';
const COPILOT_DOC = '.github/copilot-instructions.md';
const MAX_LINES = 200;
let temporary = [];
afterEach(() => {
  for (const dir of temporary) fs.rmSync(dir, { recursive: true, force: true });
  temporary = [];
});

function createRoot(claude) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-docs-'));
  temporary = [...temporary, root];
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ scripts: { verify: 'tsc', test: 'vitest run' } }));
  fs.mkdirSync(path.join(root, 'packages/compiler'), { recursive: true });
  if (claude !== undefined) fs.writeFileSync(path.join(root, CLAUDE_DOC), claude);
  return root;
}

const problemsFor = (claude) => findAgentDocProblems(createRoot(claude), [CLAUDE_DOC]);

describe('conferência dos documentos de agentes', () => {
  it('aceita script, caminho e pacote que existem', () => {
    expect(problemsFor('Rode `corepack pnpm verify` e `corepack pnpm exec vitest`; veja `packages/compiler` e `@goiasscript/compiler`.\n')).toEqual([]);
  });
  it('barra caminho inexistente, inclusive arquivo solto', () => {
    expect(problemsFor('Veja `package.json` e `legado.js`.\n')).toEqual(['CLAUDE.md: caminho "legado.js" não existe']);
  });
  it('barra script que não está no package.json', () => {
    expect(problemsFor('Rode `corepack pnpm bless`.\n')).toEqual(['CLAUDE.md: script "bless" não existe no package.json']);
  });
  it('barra pasta e pacote inexistentes e ignora glob', () => {
    expect(problemsFor('Leia `docs/adr/0001.md`, `packages/*/src` e `@goiasscript/cli`.\n')).toEqual([
      'CLAUDE.md: caminho "docs/adr/0001.md" não existe',
      'CLAUDE.md: pacote "@goiasscript/cli" não existe no workspace',
    ]);
  });
  it('barra documento ausente', () => {
    expect(findAgentDocProblems(createRoot('texto livre\n'), [COPILOT_DOC])).toEqual(['.github/copilot-instructions.md: arquivo não existe']);
  });
  it('exige CLAUDE.md com menos de 200 linhas', () => {
    expect(problemsFor('linha\n'.repeat(MAX_LINES))).toEqual(['CLAUDE.md: CLAUDE.md precisa ter menos de 200 linhas']);
    expect(problemsFor('linha\n'.repeat(MAX_LINES - 2))).toEqual([]);
  });
});
