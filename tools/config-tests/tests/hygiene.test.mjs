import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import config from '../../../vitest.config.mts';

const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
const git = (...args) => spawnSync('git', args, { cwd: ROOT_DIR, encoding: 'utf8' });
const GREP_NO_MATCH = 1;
const MINIMUM = 80;
const REMOVED_PATHS = ['goiasscript-' + 'legacy', 'packages/' + 'core', 'vscode-' + 'extension', 'lsp-' + 'server'];
const HISTORICAL_RECORDS = [':!docs/fase-*', ':!docs/superpowers', ':!docs/auditoria', ':!docs/pesquisa'];
const INVALID_IGNORE_LINE = /^\.\//u;
const BROAD_BUILD_DIRS = ['lib/', 'out/'];

const HAS_CUTOFF_TAG = git('rev-parse', '--verify', '--quiet', 'refs/tags/legacy/1.5').status === 0;

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
  it.skipIf(!HAS_CUTOFF_TAG)('todo commit depois da legacy/1.5 sai com uma só identidade, sem e-mail pessoal no .mailmap', () => {
    const identities = git('log', 'legacy/1.5..HEAD', '--use-mailmap', '--format=%aN <%aE>').stdout.trim().split('\n');
    expect(new Set(identities).size).toBe(1);
    const mailmapEmails = [...readFileSync(path.join(ROOT_DIR, '.mailmap'), 'utf8').matchAll(/<([^>]+)>/g)].map((match) => match[1]);
    for (const email of mailmapEmails) expect(email).toMatch(/@users\.noreply\.github\.com$/);
  });
  it('cobertura mínima de 80% em cada pacote, na extensão, no playground e no Worker', () => {
    const thresholds = config.test.coverage.thresholds;
    expect(Object.keys(thresholds)).toHaveLength(7);
    expect(Object.keys(thresholds)).toContain('apps/engoianador-api/src/**/*.ts');
    for (const limits of Object.values(thresholds)) expect(limits).toEqual({ lines: MINIMUM, functions: MINIMUM, branches: MINIMUM, statements: MINIMUM });
  });
  it('gitignore não ignora arquivo rastreado', () => {
    expect(git('ls-files', '--cached', '--ignored', '--exclude-standard').stdout.trim()).toBe('');
  });
  it('gitignore não tem padrão inválido nem pasta de build ampla demais', () => {
    const lines = readFileSync(path.join(ROOT_DIR, '.gitignore'), 'utf8').split('\n').map((line) => line.trim());
    expect(lines.filter((line) => INVALID_IGNORE_LINE.test(line))).toEqual([]);
    expect(lines.filter((line) => BROAD_BUILD_DIRS.includes(line))).toEqual([]);
  });
  it('sem referência ao legado fora dos registros históricos', () => {
    for (const removed of REMOVED_PATHS) {
      const found = git('grep', '-nIF', '-e', removed, '--', '.', ...HISTORICAL_RECORDS);
      expect([removed, found.stdout.trim()]).toEqual([removed, '']);
    }
  });
  it('os diretórios do legado não existem mais', () => {
    expect(git('ls-files', '--', ...REMOVED_PATHS.slice(1), '*.vsix', 'KEEP-OR-' + 'ARCHIVE.md').stdout.trim()).toBe('');
  });
  // Clone sem a tag (CI antes do push da tag) pula: a tag só existe depois que o dono a envia.
  it.skipIf(!HAS_CUTOFF_TAG)('a tag legacy/1.5 existe no repositório local', () => {
    expect(git('rev-parse', '--verify', '--quiet', 'refs/tags/legacy/1.5').status).toBe(0);
  });
});
