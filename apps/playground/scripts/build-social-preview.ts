import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ImageResponse } from 'next/og.js';
import { brandCardElement } from '../lib/brand-card/brand-card.ts';
import { SOCIAL_PREVIEW_SIZE } from '../lib/brand-card/brand-card.constants.ts';
import { loadBrandCardFonts } from '../lib/brand-card/brand-card-fonts.ts';

const SOCIAL_PREVIEW_SEGMENTS = ['..', '..', '.github', 'assets', 'social-preview.png'] as const;

// A prévia social do GitHub é enviada à mão em Settings; este arquivo é a fonte dela.
export async function buildSocialPreview(appRoot: string): Promise<string> {
  const fonts = await loadBrandCardFonts(appRoot);
  const image = new ImageResponse(brandCardElement(SOCIAL_PREVIEW_SIZE), { ...SOCIAL_PREVIEW_SIZE, fonts: [...fonts] });
  const target = join(appRoot, ...SOCIAL_PREVIEW_SEGMENTS);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, Buffer.from(await image.arrayBuffer()));
  return target;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await buildSocialPreview(join(dirname(fileURLToPath(import.meta.url)), '..'));
}
