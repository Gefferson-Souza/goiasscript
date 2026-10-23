import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { hasDictionaries } from './support/dictionaries.mjs';

const TOOL_DIR = path.resolve(import.meta.dirname, '..');
const CLI = path.join(TOOL_DIR, 'src/cli.mjs');
const TOOL_FILES = ['scope.json', 'policy.json', 'dictionaries.lock.json'];
const EMPTY_BASELINE = '{"version":1,"files":{}}\n';
// Dentro de um hook do git, GIT_DIR e afins apontam para o repositório real e desviariam o git do projeto temporário.
const CLEAN_ENV = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')));
let temporary = [];
afterEach(() => {
  for (const dir of temporary) fs.rmSync(dir, { recursive: true, force: true });
  temporary = [];
});

function createProject(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rules-scan-gate-'));
  temporary = [...temporary, root];
  spawnSync('git', ['init', '--quiet'], { cwd: root, env: CLEAN_ENV });
  fs.mkdirSync(path.join(root, 'tools/rules-scan'), { recursive: true });
  for (const name of TOOL_FILES) fs.copyFileSync(path.join(TOOL_DIR, name), path.join(root, 'tools/rules-scan', name));
  fs.writeFileSync(path.join(root, 'tools/rules-scan/baseline.json'), EMPTY_BASELINE);
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  }
  return root;
}

const check = (files) => spawnSync('node', [CLI, 'check', '--root', createProject(files)], { encoding: 'utf8', env: CLEAN_ENV });

describe.skipIf(!hasDictionaries)('gate ponta a ponta do scanner', () => {
  it('barra identificador em português no compilador (R14)', () => {
    const result = check({ 'packages/compiler/src/a.ts': 'export const existente = 1;\n' });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('R14');
    expect(result.stdout).toContain('existente');
  });
  it('barra TODO sem ticket (R10) e comentário de histórico (R13)', () => {
    const result = check({ 'packages/compiler/src/a.ts': '// TODO ajustar\n// corrige o bug do gate F2\nexport const value = 1;\n' });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('R10');
    expect(result.stdout).toContain('R13');
  });
  it('barra nome de arquivo em português', () => {
    const result = check({ 'packages/compiler/src/buscarUsuario.ts': 'export const value = 1;\n' });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('segmento de caminho em português');
  });
  it('aprova código novo em inglês', () => {
    const result = check({ 'packages/compiler/src/a.ts': 'export const currentValue = 1;\n' });
    expect(result.status).toBe(0);
  });
});
