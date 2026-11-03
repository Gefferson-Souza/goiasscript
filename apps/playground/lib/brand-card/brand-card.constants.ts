import { SHARE_SITE } from '../share-image.constants.ts';
import type { CardSize } from './brand-card.types.ts';
import { OG_SIZE, SOCIAL_SIZE, WEIGHT_BOLD, WEIGHT_REGULAR } from './brand-card-layout.constants.ts';

export const OG_CARD_SIZE: CardSize = OG_SIZE;
export const SOCIAL_PREVIEW_SIZE: CardSize = SOCIAL_SIZE;

// Primeira linha da vitrine: a declaração mostra a troca de palavra e o ponto e vírgula que aparece.
export const BRAND_CARD_LINE = 0;

export const BRAND_CARD_TEXTS = {
  alt: 'GoiásScript: a mesma linha em goianês e no JavaScript que ela vira',
  dialectLabel: 'goianês',
  javascriptLabel: 'JavaScript',
  footer: 'Código aberto, feito em Goiás',
  address: SHARE_SITE.replace('https://', ''),
} as const;

export const BRAND_CARD_FONT_DIR = 'assets/og-fonts';

export const BRAND_CARD_FONT_FILES = [
  { name: 'Space Grotesk', file: 'space-grotesk-latin-700-normal.woff', weight: WEIGHT_BOLD },
  { name: 'JetBrains Mono', file: 'jetbrains-mono-latin-400-normal.woff', weight: WEIGHT_REGULAR },
  { name: 'JetBrains Mono', file: 'jetbrains-mono-latin-700-normal.woff', weight: WEIGHT_BOLD },
] as const;
