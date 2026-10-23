import { afterEach, describe, expect, it, vi } from 'vitest';

const toPng = vi.hoisted(() => vi.fn<(node: unknown, options: unknown) => Promise<string>>());
vi.mock('html-to-image', () => ({ toPng }));

const { downloadDataUrl, nodeToPng, openTwitterIntent, SHARE_SITE } = await import('../lib/share-image.ts');

const sizedNode = (offsetWidth: number, offsetHeight: number): HTMLElement => ({ offsetWidth, offsetHeight }) as HTMLElement;

describe('imagem de compartilhamento', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    toPng.mockReset();
  });

  it('gera o PNG em alta resolução com fundo escuro', async () => {
    toPng.mockResolvedValue('data:image/png;base64,AAA');
    const node = sizedNode(600, 300);
    await expect(nodeToPng(node)).resolves.toBe('data:image/png;base64,AAA');
    expect(toPng).toHaveBeenCalledWith(node, { pixelRatio: 2, cacheBust: true, backgroundColor: '#0d1117' });
  });

  it('recusa renderizar nó sem tamanho', async () => {
    await expect(nodeToPng(sizedNode(0, 300))).rejects.toThrow('Nada pra renderizar');
    await expect(nodeToPng(sizedNode(600, 0))).rejects.toThrow('Nada pra renderizar');
    expect(toPng).not.toHaveBeenCalled();
  });

  it('baixa o dataURL como arquivo e remove o link', () => {
    const click = vi.fn();
    const remove = vi.fn();
    const appendChild = vi.fn();
    const anchor = { click, remove } as Record<string, unknown>;
    vi.stubGlobal('document', { createElement: () => anchor, body: { appendChild } });
    downloadDataUrl('data:image/png;base64,AAA', 'card.png');
    expect(anchor).toMatchObject({ href: 'data:image/png;base64,AAA', download: 'card.png' });
    expect(appendChild).toHaveBeenCalledWith(anchor);
    expect(click).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledOnce();
  });

  it('abre o compositor do X com o texto e o link do site', () => {
    const open = vi.fn();
    vi.stubGlobal('window', { open });
    openTwitterIntent('bão demais');
    const [href, target, features] = open.mock.calls[0] as [string, string, string];
    const url = new URL(href);
    expect(url.origin + url.pathname).toBe('https://twitter.com/intent/tweet');
    expect(url.searchParams.get('text')).toBe('bão demais');
    expect(url.searchParams.get('url')).toBe(SHARE_SITE);
    expect([target, features]).toEqual(['_blank', 'noopener,noreferrer']);
  });
});
