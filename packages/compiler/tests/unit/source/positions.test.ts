import { describe, expect, it } from 'vitest';
import { createSourceText, offsetAt, positionAt, rangeOf } from '../../../src/source/source-text.ts';
import { toLspPosition, toMappingPosition } from '../../../src/source/position-convert.ts';

const BOM = '﻿';

describe('posições', () => {
  it('conta \\r\\n como uma quebra e \\r isolado como quebra', () => {
    const source = createSourceText('a\r\nb\rc\nd', 't.gs');
    expect(source.lineStarts).toEqual([0, 3, 5, 7]);
    expect([3, 5, 7].map((offset) => positionAt(source, offset).line)).toEqual([2, 3, 4]);
  });
  it('arquivo do Windows com BOM e \\r\\n tem as mesmas linhas e colunas do editor', () => {
    const windows = createSourceText(`${BOM}uai x\r\nprosa(x)`, 't.gs');
    const unix = createSourceText('uai x\nprosa(x)', 't.gs');
    expect(positionAt(windows, 5)).toEqual({ offset: 5, line: 1, column: 5 });
    expect(positionAt(windows, 8)).toMatchObject({ line: 2, column: 1 });
    expect(positionAt(windows, 0)).toMatchObject({ line: 1, column: 1 });
    expect(positionAt(unix, 4)).toMatchObject({ line: 1, column: 5 });
  });
  it('não trata U+2028 como quebra e conta coluna em unidades UTF-16', () => {
    expect(positionAt(createSourceText('a b', 't.gs'), 2)).toMatchObject({ line: 1, column: 3 });
    expect(positionAt(createSourceText('😀x', 't.gs'), 2)).toMatchObject({ line: 1, column: 3 });
  });
  it('trata fim de arquivo, última linha sem \\n e offset fora do texto', () => {
    const source = createSourceText('a\n', 't.gs');
    expect(positionAt(source, 2)).toMatchObject({ line: 2, column: 1 });
    expect(positionAt(source, 999).offset).toBe(2);
    expect(positionAt(source, -5).offset).toBe(0);
    expect(createSourceText('', 't.gs').lineStarts).toEqual([0]);
  });
  it('faz ida e volta offset → posição → LSP → offset', () => {
    const source = createSourceText('uai a\r\nb\rç😀\n', 't.gs');
    const offsets = Array.from({ length: source.text.length + 1 }, (_, index) => index);
    const roundTrip = offsets.map((offset) => {
      const lsp = toLspPosition(positionAt(source, offset));
      return offsetAt(source, lsp.line + 1, lsp.character + 1);
    });
    expect(roundTrip).toEqual(offsets);
  });
  it('faz ida e volta também com BOM no início', () => {
    const source = createSourceText(`${BOM}a\r\nb`, 't.gs');
    expect(offsetAt(source, 1, 1)).toBe(1);
    expect(offsetAt(source, 9, 1)).toBe(source.text.length);
  });
  it('converte bases: LSP e mappings são base 0', () => {
    const position = positionAt(createSourceText('a\nbc', 't.gs'), 3);
    expect(toLspPosition(position)).toEqual({ line: 1, character: 1 });
    expect(toMappingPosition(position)).toEqual({ line: 1, column: 1 });
    expect(rangeOf(createSourceText('ab', 't.gs'), 0, 2).end.column).toBe(3);
  });
});
