import { describe, expect, it } from 'vitest';
import { toPrintable, toPrintableMultiline } from '../src/args/printable-text.ts';
import { printableName } from '../src/paths/display-text.ts';

const RIGHT_TO_LEFT_OVERRIDE = '‮';
const LINE_SEPARATOR = ' ';
const ZERO_WIDTH_JOINER = '‍';

describe('texto imprimível', () => {
  it('escapa o caractere bidi no nome de arquivo', () => {
    expect(printableName(`x${RIGHT_TO_LEFT_OVERRIDE}.gs`)).toBe('x\\u202e.gs');
  });

  it('mantém o escape curto dos controles C0 no nome de arquivo', () => {
    expect(printableName('a\u001bb')).toBe('a\\x1bb');
  });

  it('escapa separador de linha e invisíveis no argv', () => {
    expect(toPrintable(`a${LINE_SEPARATOR}b${ZERO_WIDTH_JOINER}`)).toBe('a\\u2028b\\u200d');
  });

  it('escapa bidi no eco multilinha sem tocar na quebra de linha', () => {
    expect(toPrintableMultiline(`x\n${RIGHT_TO_LEFT_OVERRIDE}`)).toBe('x\n\\u202e');
  });
});
