import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import homePage from '../app/page.tsx';
import { HOME_TEXTS } from '../components/landing/home-texts.constants.ts';
import { HERO_OUTPUT } from '../lib/landing/hero-code.constants.ts';
import { PRIMER_ROUTE, ENGOIANADOR_ROUTE, PLAYGROUND_ROUTE } from '../lib/landing/routes.constants.ts';

const html = renderToStaticMarkup(createElement(homePage));

describe('página inicial', () => {
  it('abre com o título e os caminhos pro playground e pra cartilha', () => {
    expect(html).toContain('<h1');
    expect(html).toContain(HOME_TEXTS.title);
    expect(html).toContain(`href="${PLAYGROUND_ROUTE}"`);
    expect(html).toContain(`href="${PRIMER_ROUTE}"`);
    expect(html).toContain(`href="${ENGOIANADOR_ROUTE}"`);
  });

  it('a vitrine começa em goianês, com o botão de virar pro JavaScript', () => {
    expect(html).toContain('data-side="dialect"');
    expect(html).toContain(HOME_TEXTS.toJavaScript);
    expect(html).not.toContain('data-flipped="true"');
  });

  it('quem usa leitor de tela recebe as duas versões do código por extenso', () => {
    expect(html).toContain('const saudacao = &quot;Bão demais da conta!&quot;;');
    expect(html).toContain('uai saudacao é &quot;Bão demais da conta!&quot;');
  });

  it('mostra a saída de verdade do programa', () => {
    for (const line of HERO_OUTPUT) expect(html).toContain(line);
  });

  it('não promete instalação que ainda não existe', () => {
    expect(html).not.toMatch(/npm (i|install)|marketplace|baixe a extensão/iu);
  });
});
