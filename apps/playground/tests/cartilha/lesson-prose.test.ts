import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LessonProse } from '../../components/cartilha/LessonProse.tsx';

const render = (markdown: string): string => renderToStaticMarkup(createElement(LessonProse, { markdown }));

describe('prosa da lição', () => {
  it('<script> no Markdown sai como texto ou é descartado, nunca como tag', () => {
    const html = render('Oi <script>alert(1)</script> sô\n\n<img src=x onerror=alert(1)>');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('onerror');
  });

  it('link javascript: é descartado', () => {
    const html = render('[clica](javascript:alert(1)) e [outro](JaVaScRiPt:alert(2))');
    expect(html).not.toMatch(/javascript:/iu);
    expect(html).toContain('clica');
  });

  it('link data: e imagem data: são descartados', () => {
    const html = render('[clica](data:text/html;base64,PHNjcmlwdD4=) ![x](data:image/svg+xml;base64,PHN2Zz4=)');
    expect(html).not.toMatch(/data:/iu);
    expect(html).not.toContain('<img');
    expect(html).toContain('clica');
  });

  it('link https e caminho interno são mantidos', () => {
    const html = render('[site](https://goiasscript.dev/x) e [lição](/cartilha/licao-02)');
    expect(html).toContain('href="https://goiasscript.dev/x"');
    expect(html).toContain('href="/cartilha/licao-02"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('link http simples é descartado', () => {
    expect(render('[x](http://exemplo.org)')).not.toContain('href=');
  });

  it('imagem do Markdown é descartada', () => {
    expect(render('![foto](https://exemplo.org/a.png)')).not.toContain('<img');
  });

  it('bloco de código vira pre/code sem HTML bruto', () => {
    const html = render('```goiasscript exemplo\nprosa("<b>oi</b>")\n```');
    expect(html).toContain('<pre><code');
    expect(html).toContain('&lt;b&gt;oi&lt;/b&gt;');
    expect(html).not.toContain('<b>');
  });

  it('título e parágrafo saem como elementos de texto', () => {
    const html = render('# Título\n\nUm `trem` aqui.');
    expect(html).toContain('<h1');
    expect(html).toContain('<code');
  });
});
