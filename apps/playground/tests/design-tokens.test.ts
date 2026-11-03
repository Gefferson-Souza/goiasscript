import { describe, expect, it } from 'vitest';
import { contrastRatio, blendOver } from '../lib/design/contrast.ts';
import { COLORS, MOTION, SELECTION_ALPHA, TEXT_PAIRS, UI_PAIRS } from '../lib/design/design-tokens.constants.ts';
import tailwindConfig from '../tailwind.config.ts';

const AA_TEXT = 4.5;
const AA_UI = 3;

describe('contraste WCAG', () => {
  it('branco sobre preto dá 21:1', () => {
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 5);
  });
  it('a ordem das cores não muda a razão', () => {
    expect(contrastRatio('#FFC93C', '#06070C')).toBeCloseTo(contrastRatio('#06070C', '#FFC93C'), 10);
  });
  it('mistura uma cor sobre o fundo pelo alfa', () => {
    expect(blendOver('#FFFFFF', '#000000', 0.5)).toBe('#808080');
    expect(blendOver('#A78BFF', '#06070C', 0)).toBe('#06070C');
  });
  it('recusa cor que não é hex de 6 dígitos', () => {
    expect(() => contrastRatio('#FFF', '#000000')).toThrow(/hex/u);
  });
});

describe('tokens da identidade Editor Infinito', () => {
  it.each(TEXT_PAIRS.map(([fg, bg]) => ({ fg, bg })))('texto $fg sobre $bg passa AA', ({ fg, bg }) => {
    expect(contrastRatio(COLORS[fg], COLORS[bg])).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it.each(UI_PAIRS.map(([fg, bg]) => ({ fg, bg })))('limite de componente $fg sobre $bg passa 3:1', ({ fg, bg }) => {
    expect(contrastRatio(COLORS[fg], COLORS[bg])).toBeGreaterThanOrEqual(AA_UI);
  });

  it('a seleção lavanda é translúcida e o código continua legível em cima dela', () => {
    expect(SELECTION_ALPHA).toBeGreaterThanOrEqual(0.25);
    expect(SELECTION_ALPHA).toBeLessThanOrEqual(0.3);
    const selection = blendOver(COLORS.caret, COLORS.panel, SELECTION_ALPHA);
    for (const ink of [COLORS.pequi, COLORS.cyan, COLORS.ink]) {
      expect(contrastRatio(ink, selection)).toBeGreaterThanOrEqual(AA_TEXT);
    }
  });

  it('a saída é mais rápida que a entrada, entre 50% e 75% dela', () => {
    const ratio = MOTION.exitMs / MOTION.enterMs;
    expect(ratio).toBeGreaterThanOrEqual(0.5);
    expect(ratio).toBeLessThanOrEqual(0.75);
  });

  it('nenhuma curva de movimento passa do ponto (sem overshoot)', () => {
    for (const curve of Object.values(MOTION.curves)) {
      const points = curve.match(/-?\d*\.?\d+/gu)?.map(Number) ?? [];
      expect(points).toHaveLength(4);
      expect(Math.max(points[1] ?? 0, points[3] ?? 0)).toBeLessThanOrEqual(1);
      expect(Math.min(points[1] ?? 0, points[3] ?? 0)).toBeGreaterThanOrEqual(0);
    }
  });

  it('o Tailwind lê as cores da fonte única de tokens', () => {
    expect(tailwindConfig.theme?.extend?.colors).toEqual(COLORS);
  });
});
