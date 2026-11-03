import { ImageResponse } from 'next/og';
import { brandCardElement } from '@/lib/brand-card/brand-card';
import { BRAND_CARD_TEXTS, OG_CARD_SIZE } from '@/lib/brand-card/brand-card.constants';
import { loadBrandCardFonts } from '@/lib/brand-card/brand-card-fonts';

export const alt = BRAND_CARD_TEXTS.alt;
export const size = OG_CARD_SIZE;
export const contentType = 'image/png';

// Gerada no build: a pasta de trabalho do Next é a raiz do playground.
export default async function OpengraphImage() {
  const fonts = await loadBrandCardFonts(process.cwd());
  return new ImageResponse(brandCardElement(OG_CARD_SIZE), { ...OG_CARD_SIZE, fonts: [...fonts] });
}
