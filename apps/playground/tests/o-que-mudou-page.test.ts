import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { WhatChanged } from '../components/cartilha/WhatChanged.tsx';
import { copyWhatChanged } from '../scripts/copy-what-changed.ts';
import { loadWhatChanged, splitPipeTables } from '../lib/cartilha/what-changed.ts';

const APP_ROOT = join(import.meta.dirname, '..');
const html = renderToStaticMarkup(createElement(WhatChanged, { markdown: loadWhatChanged(APP_ROOT) }));

describe('página o que mudou', () => {
  it('renderiza a tabela de palavras aposentadas', () => {
    expect(html).toContain('<table');
    expect(html).toContain('<th>Aposentada</th>');
    expect(html).toContain('<code>presta_serviço</code>');
    expect(html).toContain('<code>faz_trem</code>');
    expect(html.match(/<tr>/gu)?.length).toBeGreaterThan(10);
  });

  it('mantém o texto de abertura', () => {
    expect(html).toContain('O que mudou');
  });

  it('separa tabela de texto corrido', () => {
    const parts = splitPipeTables('antes\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\ndepois');
    expect(parts.map((part) => part.kind)).toEqual(['prose', 'table', 'prose']);
  });

  it('HTML bruto na célula vira texto', () => {
    const out = renderToStaticMarkup(createElement(WhatChanged, { markdown: '| a |\n|---|\n| <script>x</script> |' }));
    expect(out).not.toContain('<script');
  });

  it('falha em goianês quando o arquivo não existe', () => {
    expect(() => loadWhatChanged('/caminho/que/nao/existe')).toThrow(/Ô sô/u);
  });

  it('barra escapada fica dentro da célula', () => {
    const [table] = splitPipeTables('| a | b |\n|---|---|\n| x \\| y | z |');
    expect(table).toMatchObject({ kind: 'table', rows: [['x | y', 'z']] });
  });

  it('linhas repetidas renderizam sem key duplicada', () => {
    const errors: unknown[][] = [];
    const original = globalThis.console.error;
    globalThis.console.error = (...args: unknown[]) => void errors.push(args);
    renderToStaticMarkup(createElement(WhatChanged, { markdown: '| a |\n|---|\n| x |\n| x |' }));
    globalThis.console.error = original;
    expect(errors).toEqual([]);
  });

  it('lê a cópia local quando o docs/spec não está ao lado', () => {
    const root = mkdtempSync(join(tmpdir(), 'wc-'));
    mkdirSync(join(root, 'content'));
    writeFileSync(join(root, 'content', 'o-que-mudou.md'), '# copia');
    expect(loadWhatChanged(root)).toBe('# copia');
    rmSync(root, { recursive: true });
  });

  it('copia o spec para o app quando existe', () => {
    expect(copyWhatChanged('/caminho/que/nao/existe')).toBe('missing-source');
  });
});
