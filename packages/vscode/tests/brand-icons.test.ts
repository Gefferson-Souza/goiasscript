import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PACKAGE_ROOT } from './support/manifest.ts';

// Cores da identidade "Editor Infinito" (apps/playground/lib/design/design-tokens.constants.ts).
const PLANE = '#06070C';
const PEQUI = '#FFC93C';
const CARET = '#A78BFF';
const LEGACY_GREENS = ['#32CD32', '#228B22', '#98FB98'];

interface BrandManifest {
  readonly galleryBanner?: { readonly color: string; readonly theme: string };
}

const ICON_DIR = path.join(PACKAGE_ROOT, 'assets', 'icons');
const manifest = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8')) as BrandManifest;
const readIcon = (name: string): string => fs.readFileSync(path.join(ICON_DIR, name), 'utf8').toUpperCase();

describe('ícones da extensão com a identidade', () => {
  it.each(['goiasscript-icon.svg', 'goiasscript-file-dark.svg', 'goiasscript-file-light.svg'])('%s tem a palavra em pequi e o cursor em lavanda', (name) => {
    const svg = readIcon(name);
    expect(svg).toContain(PEQUI);
    expect(svg).toContain(CARET);
    expect(LEGACY_GREENS.some((green) => svg.includes(green))).toBe(false);
  });

  it('a página da loja abre no fundo escuro da identidade', () => {
    expect(manifest.galleryBanner).toEqual({ color: PLANE, theme: 'dark' });
  });
});
