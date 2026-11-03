import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { BRAND_CARD_FONT_DIR, BRAND_CARD_FONT_FILES } from './brand-card.constants.ts';
import type { CardFont } from './brand-card.types.ts';

// O gerador de imagem não lê woff2: as cópias em woff ficam fora de app/ para não irem ao navegador.
export async function loadBrandCardFonts(playgroundRoot: string): Promise<readonly CardFont[]> {
  return Promise.all(
    BRAND_CARD_FONT_FILES.map(async ({ name, file, weight }) => {
      const bytes = await readFile(join(playgroundRoot, BRAND_CARD_FONT_DIR, file));
      const data = new Uint8Array(bytes).buffer;
      return { name, data, weight, style: 'normal' as const };
    }),
  );
}
