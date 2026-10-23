import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
  dependencies: Record<string, string>;
  scripts: Record<string, string>;
};

describe('manifesto do playground', () => {
  it('consome o compilador novo por workspace', () => {
    expect(manifest.dependencies).toMatchObject({
      '@goiasscript/compiler': 'workspace:*',
      '@goiasscript/language': 'workspace:*',
      '@goiasscript/optimizer': 'workspace:*',
    });
  });

  it('gera os exemplos antes do dev e do build', () => {
    expect(manifest.scripts['prebuild']).toContain('build-examples.ts');
    expect(manifest.scripts['predev']).toContain('build-examples.ts');
    expect(manifest.scripts['prebuild']).not.toContain('copy-examples');
  });
});
