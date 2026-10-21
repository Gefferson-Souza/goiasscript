import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
const CLI = path.join(ROOT_DIR, 'node_modules/@commitlint/cli/cli.js');
const lint = (message) => spawnSync('node', [CLI, '--config', 'commitlint.config.mjs'], { cwd: ROOT_DIR, input: message, encoding: 'utf8' });

const rejected = [
  ['escopo com ID Jira', 'feat(SIGAGPC-1234): adiciona lexer'],
  ['escopo fora da lista', 'feat(core): adiciona lexer'],
  ['tipo inexistente', 'feature(compiler): adiciona lexer'],
  ['assunto em maiúscula', 'feat(compiler): Adiciona lexer'],
  ['assunto vago "ajustes"', 'fix(compiler): ajustes'],
  ['assunto vago "wip"', 'chore: wip'],
  ['ponto final', 'feat(compiler): adiciona lexer.'],
  ['cabeçalho acima de 72', `feat(compiler): ${'a'.repeat(60)}`],
  ['trailer da Claude', 'feat(compiler): adiciona lexer\n\ncorpo\n\nCo-Authored-By: Claude <noreply@anthropic.com>'],
  ['trailer de bot', 'chore(deps): atualiza typescript\n\nCo-authored-by: dependabot[bot] <bot@example.com>'],
  ['trailer do Copilot', 'feat(cli): adiciona comando\n\nCo-authored-by: Copilot <copilot@example.com>'],
];
const accepted = [
  ['feature com escopo', 'feat(compiler): adiciona lexer sob demanda'],
  ['sem escopo', 'docs: atualiza o claude.md'],
  ['acento e identificador no meio', 'fix(language): corrige variante sem acento de se_não'],
  ['co-autor humano', 'refactor(compiler): extrai tabela de linhas\n\ncorpo\n\nCo-authored-by: Abbott Silva <abbott@example.com>'],
];

describe('commitlint (ADR-0008)', () => {
  it.each(rejected)('rejeita: %s', (_title, message) => { expect(lint(message).status).toBe(1); });
  it.each(accepted)('aceita: %s', (_title, message) => { expect(lint(message).status).toBe(0); });
});
