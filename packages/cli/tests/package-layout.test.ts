import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const STABLE_V3_VERSION = /^3\.\d+\.\d+$/u;

const readJson = (relative: string): Record<string, unknown> =>
  JSON.parse(readFileSync(new URL(relative, import.meta.url), 'utf8')) as Record<string, unknown>;

describe('manifestos', () => {
  it('o pacote publicável é o goiasscript novo, sem dependências de runtime', () => {
    const manifest = readJson('../package.json');
    expect(manifest.name).toBe('goiasscript');
    expect(manifest.version).toMatch(STABLE_V3_VERSION);
    expect(Object.keys(manifest.bin as object).sort()).toEqual(['goias', 'goiasscript']);
    expect(manifest.dependencies).toBeUndefined();
    expect(manifest.files).toEqual(['dist', 'README.md', 'LICENSE']);
    expect((manifest.engines as { node: string }).node).toBe('>=22.12');
  });
  it('o CLI e a extensão andam na mesma versão', () => {
    expect(readJson('../package.json').version).toBe(readJson('../../vscode/package.json').version);
  });
  it('o playground não consome o pacote publicável', () => {
    const playground = readJson('../../../apps/playground/package.json');
    expect(playground.dependencies).not.toHaveProperty('goiasscript');
  });
});
