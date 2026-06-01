import { toPng } from 'html-to-image';

const SITE = 'https://playground.goiasscript.com.br';

/** Gera um PNG do nó (alta resolução) e devolve o dataURL. */
export async function nodeToPng(node: HTMLElement): Promise<string> {
  return toPng(node, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: '#0d1117',
  });
}

/** Dispara o download de um dataURL como arquivo .png. */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Abre o compositor do X/Twitter com texto + link do site. */
export function openTwitterIntent(texto: string): void {
  const url = new URL('https://twitter.com/intent/tweet');
  url.searchParams.set('text', texto);
  url.searchParams.set('url', SITE);
  window.open(url.toString(), '_blank', 'noopener,noreferrer');
}

export const SHARE_SITE = SITE;
