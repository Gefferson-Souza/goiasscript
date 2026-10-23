import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { TraceabilityEntry, TraceabilityFs } from '../../../scripts/gate.types.ts';
import { checkTraceability, loadTraceability } from '../../../scripts/traceability.ts';

const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
const SPEC_PATH = 'docs/superpowers/specs/2026-10-14-goiasscript-3-design.md';
const TABLE_ROW = /^\|\s*(.+?)\s*\|\s*(.+?)\s*\|$/u;
const EXPECTED_PROMISES = 15;

const files: Readonly<Record<string, string>> = {
  'a.test.ts': "it('faz a coisa', () => {})",
  '.github/workflows/w.yml': 'name: w',
  'scripts/s.ts': 'export {}',
};
const memory: TraceabilityFs = { exists: (file) => file in files, read: (file) => files[file] ?? '' };
const entry = (overrides: Partial<TraceabilityEntry>): TraceabilityEntry => ({ promise: 'p', proofs: [{ kind: 'test', path: 'a.test.ts', name: 'faz a coisa' }], state: 'green', ...overrides });

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
    const ok = checkTraceability([entry({ state: 'ready', proofs: [{ kind: 'workflow', path: '.github/workflows/w.yml' }] })], memory);
    const onlyTest = checkTraceability([entry({ state: 'ready' })], memory);
    const absent = checkTraceability([entry({ state: 'ready', proofs: [{ kind: 'script', path: 'scripts/nada.ts' }] })], memory);
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
