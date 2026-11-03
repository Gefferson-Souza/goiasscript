import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildReadmeBanner } from '../scripts/build-readme-banner.ts';
import { COLORS } from '../lib/design/design-tokens.constants.ts';
import { HERO_LINES } from '../lib/landing/hero-code.constants.ts';
import { renderSide } from '../lib/landing/hero-code.ts';
import { BRAND_CARD_LINE } from '../lib/brand-card/brand-card.constants.ts';
import { readmeBannerSvg } from '../lib/brand-card/readme-banner.ts';
import { bannerFrames } from '../lib/brand-card/readme-banner-frames.ts';

const FAKE_FONTS = { sansBold: 'U0FOUw==', monoRegular: 'TU9OTw==', monoBold: 'Qk9MRA==' };
const svg = readmeBannerSvg(FAKE_FONTS);
const line = HERO_LINES[BRAND_CARD_LINE] ?? [];
const visibleText = (markup: string): string => markup.replace(/<[^>]+>/gu, '');

describe('banner animado do README', () => {
  it('é SVG puro, sem script e sem nada de fora', () => {
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).not.toMatch(/<script|href="http|url\(http/u);
  });

  it('traz a linha da vitrine nas duas versões, com as cores da identidade', () => {
    const text = visibleText(svg).replaceAll('&quot;', '"');
    for (const side of ['dialect', 'javascript'] as const) {
      for (const word of renderSide([line], side).split(/\s+/u)) expect(text).toContain(word);
    }
    expect(svg).toContain(COLORS.pequi);
    expect(svg).toContain(COLORS.cyan);
    expect(svg).toContain(COLORS.caret);
  });

  it('para parado em goianês para quem pede menos movimento', () => {
    expect(svg).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('embute as fontes da identidade', () => {
    for (const data of Object.values(FAKE_FONTS)) expect(svg).toContain(data);
  });
});

describe('quadros da animação', () => {
  const frames = bannerFrames(line);

  it('cada palavra vira uma vez na ida e uma vez na volta', () => {
    const swaps = line.filter((segment) => segment.kind === 'swap').length;
    expect(frames.events).toHaveLength(swaps * 2);
  });

  it('no fim da ida a linha está em JavaScript e no fim da volta em goianês', () => {
    expect(frames.textAt(frames.events.length / 2)).toBe(renderSide([line], 'javascript'));
    expect(frames.textAt(frames.events.length)).toBe(renderSide([line], 'dialect'));
    expect(frames.textAt(0)).toBe(renderSide([line], 'dialect'));
  });

  it('os momentos de virada sobem em ordem e cabem no ciclo', () => {
    const times = frames.events.map((event) => event.atSeconds);
    expect([...times].sort((a, b) => a - b)).toEqual(times);
    expect(times.every((time) => time > 0 && time < frames.cycleSeconds)).toBe(true);
  });
});

describe('arquivo do banner no repositório', () => {
  it('está igual ao que o gerador produz hoje', () => {
    expect(buildReadmeBanner(fileURLToPath(new URL('..', import.meta.url)), true)).toBe('fresh');
  });
});
