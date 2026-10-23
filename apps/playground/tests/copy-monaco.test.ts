import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { MONACO_BASE_PATH } from '../lib/monaco/monaco-assets.ts';
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
    expect(copyMonaco(root)).toBe('copied');
    expect(readFileSync(join(root, 'public', MONACO_BASE_PATH, 'editor', 'editor.main.js'), 'utf8')).toBe('ok');
  });

  it('avisa quando o Monaco não está instalado e não cria nada', () => {
    const root = makeRoot();
    expect(copyMonaco(root)).toBe('missing-source');
    expect(existsSync(join(root, 'public'))).toBe(false);
  });
});
