import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import config from '../../../vitest.config.mts';

const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
const git = (...args) => spawnSync('git', args, { cwd: ROOT_DIR, encoding: 'utf8' });
const GREP_NO_MATCH = 1;
const MINIMUM = 80;

describe('higiene do repositório (GATE 1)', () => {
  it('nenhum arquivo rastreado cita caminho da máquina do autor', () => { expect(git('grep', '-nE', '/hom[e]/').status).toBe(GREP_NO_MATCH); });
  it('research_notes e reports ficam fora do git', () => {
    expect(git('check-ignore', 'research_notes/nota.md').status).toBe(0);
    expect(git('check-ignore', 'reports/relatorio.md').status).toBe(0);
  });
  it('o corpus é -text e .gs é JavaScript para o Linguist', () => {
    const attributes = git('check-attr', 'text', 'linguist-language', '--', 'packages/compiler/tests/conformance/a/input.gs').stdout;
    expect(attributes).toContain('text: unset');
    expect(attributes).toContain('linguist-language: JavaScript');
  });
  // Desligado até o .mailmap unificar as identidades (inclui o bot google-labs-jules[bot]); depois, remover o skipIf.
  it.skipIf(process.env.GS_CHECK_AUTHORSHIP !== '1')('toda autoria do histórico vira uma só identidade', () => {
    const identities = git('log', '--all', '--use-mailmap', '--format=%aN <%aE>').stdout.trim().split('\n');
    expect(new Set(identities).size).toBe(1);
  });
  it('cobertura mínima de 80% em cada pacote', () => {
    const thresholds = config.test.coverage.thresholds;
    expect(Object.keys(thresholds)).toHaveLength(3);
    for (const limits of Object.values(thresholds)) expect(limits).toEqual({ lines: MINIMUM, functions: MINIMUM, branches: MINIMUM, statements: MINIMUM });
  });
});
