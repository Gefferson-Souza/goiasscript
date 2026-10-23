import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { lessonStaticParams, loadPrimer } from '../../lib/cartilha/cartilha-content.ts';

const CONTENT_DIR = join(import.meta.dirname, '..', '..', 'content', 'cartilha');

describe('parâmetros estáticos da cartilha', () => {
  it('um id por lição do diretório de conteúdo', () => {
    const files = readdirSync(CONTENT_DIR).filter((name) => /^licao-\d{2}\.md$/u.test(name));
    const params = lessonStaticParams(loadPrimer(CONTENT_DIR));
    expect(params.map((entry) => entry.id)).toEqual(files.map((name) => name.replace('.md', '')).sort());
    expect(params.length).toBeGreaterThan(0);
  });

  it('recusa o build quando a cartilha tem problema', () => {
    const dir = mkdtempSync(join(tmpdir(), 'gs-cartilha-'));
    try {
      writeFileSync(join(dir, 'licao-1.md'), 'sem frontmatter');
      expect(() => loadPrimer(dir)).toThrow(/cartilha/u);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
