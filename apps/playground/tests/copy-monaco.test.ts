import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { EDITOR_WORKER_FILE, MONACO_BASE_PATH } from '../lib/monaco/monaco-assets.ts';
import { copyMonaco } from '../scripts/copy-monaco.ts';

const roots: string[] = [];
const makeRoot = (): string => {
  const root = mkdtempSync(join(tmpdir(), 'copy-monaco-'));
  roots.push(root);
  return root;
};

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('copyMonaco', () => {
  it('copia min/vs do monaco-editor para public/vs', () => {
    const root = makeRoot();
    const source = join(root, 'node_modules', 'monaco-editor', 'min', 'vs', 'editor');
    mkdirSync(source, { recursive: true });
    writeFileSync(join(source, 'editor.main.js'), 'ok');
    mkdirSync(join(source, '..', 'assets'));
    writeFileSync(join(source, '..', 'assets', 'editor.worker-Abc123.js'), 'worker');
    expect(copyMonaco(root)).toBe('copied');
    expect(readFileSync(join(root, 'public', MONACO_BASE_PATH, 'editor', 'editor.main.js'), 'utf8')).toBe('ok');
  });

  it('dá nome fixo ao worker do editor, para a página carregar da própria origem', () => {
    const root = makeRoot();
    const assets = join(root, 'node_modules', 'monaco-editor', 'min', 'vs', 'assets');
    mkdirSync(assets, { recursive: true });
    writeFileSync(join(assets, 'editor.worker-Abc123.js'), 'worker');
    writeFileSync(join(assets, 'json.worker-Xyz.js'), 'json');
    expect(copyMonaco(root)).toBe('copied');
    expect(readFileSync(join(root, 'public', MONACO_BASE_PATH, EDITOR_WORKER_FILE), 'utf8')).toBe('worker');
  });

  it('falha quando o worker do editor não vem no pacote', () => {
    const root = makeRoot();
    mkdirSync(join(root, 'node_modules', 'monaco-editor', 'min', 'vs', 'assets'), { recursive: true });
    expect(copyMonaco(root)).toBe('missing-worker');
  });

  it('avisa quando o Monaco não está instalado e não cria nada', () => {
    const root = makeRoot();
    expect(copyMonaco(root)).toBe('missing-source');
    expect(existsSync(join(root, 'public'))).toBe(false);
  });
});
