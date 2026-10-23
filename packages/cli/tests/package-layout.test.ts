import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readJson = (relative: string): Record<string, unknown> =>
  JSON.parse(readFileSync(new URL(relative, import.meta.url), 'utf8')) as Record<string, unknown>;

describe('manifestos', () => {
  it('o pacote publicável é o goiasscript novo, sem dependências de runtime', () => {
    const manifest = readJson('../package.json');
    expect(manifest.name).toBe('goiasscript');
    expect(manifest.version).toMatch(/^3\.0\.0-alpha\.\d+$/u);
    expect(Object.keys(manifest.bin as object).sort()).toEqual(['goias', 'goiasscript']);
    expect(manifest.dependencies).toBeUndefined();
    expect(manifest.files).toEqual(['dist', 'README.md', 'LICENSE']);
    expect((manifest.engines as { node: string }).node).toBe('>=22.12');
  });
  it('o legado deixa o nome e não publica mais nada', () => {
    const legacy = readJson('../../core/package.json');
    expect(legacy).toMatchObject({ name: 'goiasscript-legacy', private: true });
    expect([legacy.bin, legacy.publishConfig]).toEqual([undefined, undefined]);
  });
  it('o playground não consome mais o legado nem o pacote publicável', () => {
    const playground = readJson('../../../apps/playground/package.json');
    expect(playground.dependencies).not.toHaveProperty('goiasscript-legacy');
    expect(playground.dependencies).not.toHaveProperty('goiasscript');
  });
});
