import { describe, expect, it } from 'vitest';
import { canonicalName, isCombiningMark, isIdentifierPart, isIdentifierStart, isValidName } from '../../../src/source/identifier-alphabet.ts';

describe('alfabeto de nomes (P5)', () => {
  it.each([
    ['café', true], ['Ação', true], ['_x1', true], ['ça', true],
    ['1x', false], ['αβ', false], ['a$b', false], ['\u{1F600}', false], ['x́', false], ['', false],
  ])('valida %j como %s', (name, expected) => {
    expect(isValidName(name)).toBe(expected);
  });
  it('trata café em NFD e NFC como o mesmo nome canônico (NFC)', () => {
    expect(canonicalName('café')).toBe('café');
    expect(isValidName(canonicalName('café'))).toBe(true);
    expect(canonicalName('abc')).toBe('abc');
  });
  it('separa início, continuação e marca combinante', () => {
    expect([isIdentifierStart(0x31), isIdentifierPart(0x31), isIdentifierStart(0x5f)]).toEqual([false, true, true]);
    expect([isCombiningMark(0x300), isCombiningMark(0x36f), isCombiningMark(0x2ff), isCombiningMark(0x370)]).toEqual([true, true, false, false]);
  });
});
