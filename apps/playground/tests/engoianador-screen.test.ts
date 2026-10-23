import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EngoianadorScreen } from '../app/engoianador/engoianador-screen.tsx';
import { FAILURE_MESSAGES } from '../lib/engoianador-messages.constants.ts';

describe('tela do Engoianador', () => {
  it('sem URL mostra a folga e nenhum botão de enviar', () => {
    const html = renderToStaticMarkup(createElement(EngoianadorScreen, { engoianadorUrl: null }));
    expect(html).toContain('O Engoianador tá de folga, sô');
    expect(html).not.toContain('<textarea');
    expect(html).not.toContain('<button');
  });

  it('com URL mostra o aviso de privacidade junto do botão', () => {
    const html = renderToStaticMarkup(
      createElement(EngoianadorScreen, { engoianadorUrl: 'https://engoianador.example.org/' }),
    );
    expect(html).toContain('provedor de LLM');
    expect(html).toContain('guardado em cache');
    expect(html).toContain('Engoianar esse trem');
    expect(html.indexOf('provedor de LLM')).toBeGreaterThan(html.indexOf('<textarea'));
  });
});

describe('mensagens de falha', () => {
  it('cada motivo tem mensagem em goianês', () => {
    expect(Object.keys(FAILURE_MESSAGES).sort()).toEqual(['disabled', 'invalid', 'rate-limited', 'unavailable']);
    for (const message of Object.values(FAILURE_MESSAGES)) expect(message).toMatch(/sô|uai|rapaz/u);
  });
});
