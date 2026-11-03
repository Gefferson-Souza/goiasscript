import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HOME_TEXTS } from '../components/landing/home-texts.constants.ts';
import { brandCardElement } from '../lib/brand-card/brand-card.ts';
import { BRAND_CARD_LINE, OG_CARD_SIZE, SOCIAL_PREVIEW_SIZE } from '../lib/brand-card/brand-card.constants.ts';
import { loadBrandCardFonts } from '../lib/brand-card/brand-card-fonts.ts';
import { codeTokens } from '../lib/brand-card/brand-card-tokens.ts';
import { COLORS } from '../lib/design/design-tokens.constants.ts';
import { HERO_LINES } from '../lib/landing/hero-code.constants.ts';
import { renderSide } from '../lib/landing/hero-code.ts';

const PLAYGROUND_ROOT = fileURLToPath(new URL('..', import.meta.url));
const heroLine = HERO_LINES[BRAND_CARD_LINE] ?? [];
const joined = (side: 'dialect' | 'javascript'): string => codeTokens(heroLine, side).map((token) => token.text).join('');

describe('fichas de código do cartão', () => {
  it('mostra a mesma linha da vitrine, conferida pelo compilador', () => {
    expect(joined('dialect')).toBe(renderSide([heroLine], 'dialect'));
    expect(joined('javascript')).toBe(renderSide([heroLine], 'javascript'));
  });

  it('pinta goianês de pequi, JavaScript de ciano e texto de verde', () => {
    const dialect = codeTokens(heroLine, 'dialect');
    const javascript = codeTokens(heroLine, 'javascript');
    expect(dialect.find((token) => token.text === 'uai')?.color).toBe(COLORS.pequi);
    expect(javascript.find((token) => token.text === 'const')?.color).toBe(COLORS.cyan);
    expect(javascript.find((token) => token.text.startsWith('"'))?.color).toBe(COLORS.string);
    expect(dialect.filter((token) => token.keyword).map((token) => token.text)).toEqual(['uai', 'é']);
  });

  it('não deixa ficha vazia onde o goianês não tem ponto e vírgula', () => {
    expect(codeTokens(heroLine, 'dialect').every((token) => token.text.length > 0)).toBe(true);
  });
});

describe('cartão de compartilhamento', () => {
  it('tem os tamanhos do Open Graph e da prévia do GitHub', () => {
    expect(OG_CARD_SIZE).toEqual({ width: 1200, height: 630 });
    expect(SOCIAL_PREVIEW_SIZE).toEqual({ width: 1280, height: 640 });
  });

  it('leva o nome, o título da página inicial e o endereço do repositório', () => {
    const html = renderToStaticMarkup(brandCardElement(OG_CARD_SIZE));
    expect(html).toContain('Goiás');
    for (const sentence of HOME_TEXTS.title.split('. ')) expect(html).toContain(sentence.replace(/\.$/u, ''));
    expect(html).toContain('github.com/Gefferson-Souza/goiasscript');
    expect(html).toContain('width:1200px');
  });

  it('carrega as fontes da identidade do próprio repositório', async () => {
    const fonts = await loadBrandCardFonts(PLAYGROUND_ROOT);
    expect(fonts.map((font) => font.name)).toEqual(['Space Grotesk', 'JetBrains Mono', 'JetBrains Mono']);
    expect(fonts.every((font) => font.data.byteLength > 0)).toBe(true);
  });
});
