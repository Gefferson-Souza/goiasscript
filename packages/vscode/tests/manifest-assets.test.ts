import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PACKAGE_ROOT, REPOSITORY_ROOT } from './support/manifest.ts';

interface IconTheme {
  readonly light: string;
  readonly dark: string;
}

interface AssetManifest {
  readonly icon: string;
  readonly contributes: {
    readonly languages: readonly { readonly configuration: string; readonly icon: IconTheme }[];
    readonly grammars: readonly { readonly path: string }[];
    readonly snippets: readonly { readonly path: string }[];
  };
}

const manifest = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8')) as AssetManifest;
const [language] = manifest.contributes.languages;
const PNG_SIGNATURE_BYTES = 8;
const PNG_WIDTH_OFFSET = PNG_SIGNATURE_BYTES + 8;
const PNG_HEIGHT_OFFSET = PNG_WIDTH_OFFSET + 4;
const EXPECTED_ICON_SIZE = 128;

function declaredPaths(): readonly string[] {
  return [
    manifest.icon,
    language?.configuration ?? '',
    language?.icon.light ?? '',
    language?.icon.dark ?? '',
    ...manifest.contributes.grammars.map((grammar) => grammar.path),
    ...manifest.contributes.snippets.map((snippet) => snippet.path),
  ];
}

function isTracked(relativePath: string): boolean {
  const output = execFileSync('git', ['ls-files', '--', relativePath], { cwd: REPOSITORY_ROOT, encoding: 'utf8' });
  return output.trim() !== '';
}

describe('arquivos citados no manifesto', () => {
  it('cita ícone, configuração, gramática, snippets e ícones de arquivo', () => {
    expect(declaredPaths().every((declared) => declared.startsWith('./'))).toBe(true);
    expect(declaredPaths()).toHaveLength(6);
  });

  it.each(declaredPaths())('%s existe', (declared) => {
    expect(fs.existsSync(path.join(PACKAGE_ROOT, declared))).toBe(true);
  });

  it.each(declaredPaths())('%s está rastreado pelo git', (declared) => {
    const relative = path.relative(REPOSITORY_ROOT, path.join(PACKAGE_ROOT, declared));
    expect(isTracked(relative.split(path.sep).join('/'))).toBe(true);
  });

  it('o ícone da extensão é um PNG de 128 por 128', () => {
    const bytes = fs.readFileSync(path.join(PACKAGE_ROOT, manifest.icon));
    expect(bytes.subarray(1, 4).toString('latin1')).toBe('PNG');
    expect(bytes.readUInt32BE(PNG_WIDTH_OFFSET)).toBe(EXPECTED_ICON_SIZE);
    expect(bytes.readUInt32BE(PNG_HEIGHT_OFFSET)).toBe(EXPECTED_ICON_SIZE);
  });
});
