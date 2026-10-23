import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { WhatChanged } from '../components/cartilha/WhatChanged.tsx';
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
});
