import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EngoianadorIdleNotice } from '../app/engoianador/engoianador-idle-notice.tsx';
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

describe('aviso de folga', () => {
  it('é o mesmo aviso que a tela mostra sem URL', () => {
    const notice = renderToStaticMarkup(createElement(EngoianadorIdleNotice));
    const screen = renderToStaticMarkup(createElement(EngoianadorScreen, { engoianadorUrl: null }));
    expect(screen).toContain(notice);
    expect(notice).toContain('role="status"');
  });

  it('oferece nova checagem só quando recebe o callback', () => {
    const withButton = renderToStaticMarkup(createElement(EngoianadorIdleNotice, { onRecheck: () => undefined }));
    expect(withButton).toContain('Dá outra olhada, sô');
    expect(withButton).toContain('<button');
  });
});

describe('mensagens de falha', () => {
  it('cada motivo tem mensagem em goianês', () => {
    expect(Object.keys(FAILURE_MESSAGES).sort()).toEqual(['disabled', 'invalid', 'rate-limited', 'unavailable']);
    for (const message of Object.values(FAILURE_MESSAGES)) expect(message).toMatch(/sô|uai|rapaz/u);
  });
});
