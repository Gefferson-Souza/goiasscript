import { toPng } from 'html-to-image';
import { SHARE_IMAGE_BACKGROUND, SHARE_IMAGE_PIXEL_RATIO, SHARE_SITE, TWITTER_INTENT_URL } from './share-image.constants.ts';

export { SHARE_SITE };

/** Gera um PNG do nó (alta resolução) e devolve o dataURL. */
export async function nodeToPng(node: HTMLElement): Promise<string> {
  if (node.offsetHeight === 0 || node.offsetWidth === 0) {
    throw new Error('Nada pra renderizar no card ainda, sô.');
  }
  return toPng(node, { pixelRatio: SHARE_IMAGE_PIXEL_RATIO, cacheBust: true, backgroundColor: SHARE_IMAGE_BACKGROUND });
}

/** Dispara o download de um dataURL como arquivo .png. */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const anchor = Object.assign(document.createElement('a'), { href: dataUrl, download: filename });
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

/** Abre o compositor do X/Twitter com texto + link do site. */
export function openTwitterIntent(text: string): void {
  const url = new URL(TWITTER_INTENT_URL);
  url.searchParams.set('text', text);
  url.searchParams.set('url', SHARE_SITE);
  window.open(url.toString(), '_blank', 'noopener,noreferrer');
}
