import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
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
  // O .mailmap não repete e-mail pessoal; por isso só os commits a partir da tag de corte têm identidade única.
  it('todo commit depois da legacy/1.5 sai com uma só identidade, sem e-mail pessoal no .mailmap', () => {
    const identities = git('log', 'legacy/1.5..HEAD', '--use-mailmap', '--format=%aN <%aE>').stdout.trim().split('\n');
    expect(new Set(identities).size).toBe(1);
    const mailmapEmails = [...readFileSync(path.join(ROOT_DIR, '.mailmap'), 'utf8').matchAll(/<([^>]+)>/g)].map((match) => match[1]);
    for (const email of mailmapEmails) expect(email).toMatch(/@users\.noreply\.github\.com$/);
  });
  it('cobertura mínima de 80% em cada pacote, na extensão e no código do playground', () => {
    const thresholds = config.test.coverage.thresholds;
    expect(Object.keys(thresholds)).toHaveLength(6);
    for (const limits of Object.values(thresholds)) expect(limits).toEqual({ lines: MINIMUM, functions: MINIMUM, branches: MINIMUM, statements: MINIMUM });
  });
});
