import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const config: Record<string, unknown> = JSON.parse(
  readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'),
) as Record<string, unknown>;

describe('vercel.json', () => {
  it('não declara cabeçalhos: a fonte única é o next.config.ts', () => {
    expect(config).not.toHaveProperty('headers');
  });

  it('usa o framework nextjs', () => {
    expect(config.framework).toBe('nextjs');
  });

  it('instala com lockfile congelado pelo corepack', () => {
    expect(config.installCommand).toBe('corepack pnpm install --frozen-lockfile');
  });

  it('só traz as chaves de build previstas', () => {
    expect(Object.keys(config).sort()).toEqual(['buildCommand', 'framework', 'installCommand', 'outputDirectory']);
  });

  it('mantém o diretório de saída padrão do Next', () => {
    expect(config.outputDirectory).toBe('.next');
  });
});
