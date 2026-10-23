import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { TraceabilityEntry, TraceabilityFs } from '../../../scripts/gate.types.ts';
import { checkTraceability, loadReadmeClaims, loadTraceability, realFiles, testRunsIn } from '../../../scripts/traceability.ts';
import { readmeClaims, readmeProblems, renderReport } from '../../../scripts/traceability-report.ts';
import { runCheckTraceability } from '../../../scripts/check-traceability.ts';

const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
const SPEC_PATH = 'docs/superpowers/specs/2026-10-14-goiasscript-3-design.md';
const TABLE_ROW = /^\|\s*(.+?)\s*\|\s*(.+?)\s*\|$/u;
const EXPECTED_PROMISES = 15;

const files: Readonly<Record<string, string>> = {
  'a.test.ts': "it('faz a coisa', () => {})",
  'commented.test.ts': "// faz a coisa\nit('outro teste', () => {})",
  'apps/playground-e2e/tests/b.spec.ts': "test('abre a tela', async () => {})",
  '.github/workflows/w.yml': 'name: w',
  'scripts/s.ts': 'export {}',
};
const memory: TraceabilityFs = { exists: (file) => file in files, read: (file) => files[file] ?? '' };
const entry = (overrides: Partial<TraceabilityEntry>): TraceabilityEntry => ({ promise: 'p', proofs: [{ kind: 'test', path: 'a.test.ts', name: 'faz a coisa', runsIn: 'verify' }], state: 'green', ...overrides });

function specPromises(): readonly string[] {
  const section = fs.readFileSync(path.join(ROOT_DIR, SPEC_PATH), 'utf8').split('## 11. Rastreabilidade das promessas públicas')[1]?.split('\n## 12.')[0] ?? '';
  return section.split('\n').map((line) => TABLE_ROW.exec(line)?.[1] ?? '').filter((cell) => cell !== '' && cell !== 'Promessa (vídeo/README)' && !cell.startsWith('---'));
}

describe('checkTraceability', () => {
  it('prova que existe e traz o nome do teste passa', () => {
    expect(checkTraceability([entry({})], memory)).toEqual([]);
  });

  it('prova com arquivo inexistente é missing', () => {
    const problems = checkTraceability([entry({ proofs: [{ kind: 'test', path: 'nao-existe.test.ts', name: 'x' }] })], memory);
    expect(problems).toHaveLength(1);
    expect(problems[0]?.message).toContain('nao-existe.test.ts');
  });

  it('prova com nome de teste ausente do arquivo é missing', () => {
    const problems = checkTraceability([entry({ proofs: [{ kind: 'test', path: 'a.test.ts', name: 'outro nome' }] })], memory);
    expect(problems).toHaveLength(1);
    expect(problems[0]?.message).toContain('outro nome');
  });

  it('nome só em comentário não vale como teste', () => {
    const problems = checkTraceability([entry({ proofs: [{ kind: 'test', path: 'commented.test.ts', name: 'faz a coisa', runsIn: 'verify' }] })], memory);
    expect(problems).toHaveLength(1);
    expect(problems[0]?.message).toContain('não é título');
  });

  it('registra onde o teste roda e recusa registro errado', () => {
    const ci = { kind: 'test', path: 'apps/playground-e2e/tests/b.spec.ts', name: 'abre a tela' } as const;
    expect(checkTraceability([entry({ proofs: [{ ...ci, runsIn: 'ci' }] })], memory)).toEqual([]);
    expect(checkTraceability([entry({ proofs: [{ ...ci, runsIn: 'verify' }] })], memory)).toHaveLength(1);
    expect(checkTraceability([entry({ proofs: [ci] })], memory)).toHaveLength(1);
    expect(testRunsIn('packages/vscode/tests/integration/x.test.ts')).toBe('ci');
    expect(testRunsIn('packages/cli/tests/e2e/x.e2e.ts')).toBe('ci');
    expect(testRunsIn('packages/cli/tests/repl-loop.test.ts')).toBe('verify');
  });

  it('estado missing sempre falha', () => {
    expect(checkTraceability([entry({ state: 'missing' })], memory)).toHaveLength(1);
  });

  it('promessa sem nenhuma prova falha', () => {
    expect(checkTraceability([entry({ proofs: [] })], memory)).toHaveLength(1);
  });

  it('estado green exige um teste', () => {
    const problems = checkTraceability([entry({ proofs: [{ kind: 'workflow', path: '.github/workflows/w.yml' }] })], memory);
    expect(problems).toHaveLength(1);
  });

  it('estado ready exige workflow ou script existente', () => {
    const ok = checkTraceability([entry({ state: 'ready', ownerCommand: 'do x', proofs: [{ kind: 'workflow', path: '.github/workflows/w.yml' }] })], memory);
    const onlyTest = checkTraceability([entry({ state: 'ready', ownerCommand: 'do x' })], memory);
    const absent = checkTraceability([entry({ state: 'ready', ownerCommand: 'do x', proofs: [{ kind: 'script', path: 'scripts/nada.ts' }] })], memory);
    expect(ok).toEqual([]);
    expect(onlyTest).toHaveLength(1);
    expect(absent).toHaveLength(1);
  });
});

describe('tabela versionada', () => {
  const entries = loadTraceability(ROOT_DIR);

  it('cada linha do §11 está na tabela', () => {
    const promises = specPromises();
    expect(promises).toHaveLength(EXPECTED_PROMISES);
    expect(entries.map((item) => item.promise)).toEqual(promises);
  });

  it('toda prova existe no repositório e nenhuma promessa está missing', () => {
    const real: TraceabilityFs = { exists: (file) => fs.existsSync(path.join(ROOT_DIR, file)), read: (file) => fs.readFileSync(path.join(ROOT_DIR, file), 'utf8') };
    expect(checkTraceability(entries, real)).toEqual([]);
    expect(entries.every((item) => item.state !== 'missing')).toBe(true);
  });
});

describe('estado ready e relatório', () => {
  const ready = entry({ promise: 'pronta', state: 'ready', ownerCommand: 'gh workflow run w.yml', proofs: [{ kind: 'workflow', path: '.github/workflows/w.yml' }] });

  it('estado ready lista o comando do dono', () => {
    expect(checkTraceability([entry({ state: 'ready', proofs: ready.proofs })], memory)).toHaveLength(1);
    expect(renderReport([entry({ promise: 'verde' }), ready])).toContain('gh workflow run w.yml');
  });

  it('o relatório separa green, ready e o que falta do dono', () => {
    const text = renderReport([entry({ promise: 'verde' }), ready, entry({ promise: 'faltando', state: 'missing' })]);
    expect(text).toMatch(/green \(1\)[\s\S]*verde/u);
    expect(text).toMatch(/ready \(1\)[\s\S]*pronta/u);
    expect(text).toMatch(/missing \(1\)[\s\S]*faltando/u);
  });

  it('--report imprime o relatório e sai 0 com a tabela versionada', () => {
    const out: string[] = [];
    const code = runCheckTraceability(ROOT_DIR, { out: (text) => out.push(text), err: () => undefined }, true);
    expect(code).toBe(0);
    expect(out.join('')).toContain('ready');
  });
});

describe('README', () => {
  const entries = [...loadTraceability(ROOT_DIR), ...loadReadmeClaims(ROOT_DIR)];
  const readme = fs.readFileSync(path.join(ROOT_DIR, 'README.md'), 'utf8');

  it('toda promessa do README está na tabela', () => {
    expect(readmeClaims(readme).length).toBeGreaterThan(0);
    expect(readmeProblems(readme, entries)).toEqual([]);
    expect(checkTraceability(loadReadmeClaims(ROOT_DIR), realFiles(ROOT_DIR))).toEqual([]);
  });

  it('promessa sem prova falha', () => {
    const problems = readmeProblems('| `goiasscript inventado x.gs` | faz mágica |', entries);
    expect(problems).toHaveLength(1);
    expect(problems[0]?.message).toContain('goiasscript inventado');
  });

  it('número de testes sem fonte falha', () => {
    expect(readmeProblems('Temos 1200 testes.', entries)).toHaveLength(1);
    expect(readmeProblems('Temos 1200 testes (fonte: relatório do CI).', entries)).toEqual([]);
  });
});
