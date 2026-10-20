import { describe, expect, it } from 'vitest';
import { createLineTable, positionAt, toDiagnostic } from '../src/diagnostics.ts';

describe('tabela de linhas', () => {
  it('conta \\n, \\r\\n e \\r isolado como uma quebra cada', () => {
    expect(createLineTable('a\nb\r\nc\rd').lineStarts).toEqual([0, 2, 5, 7]);
  });

  it('devolve linha e coluna base 1 em unidades UTF-16', () => {
    const table = createLineTable('uai x\n😀 y');
    expect(positionAt(table, 4)).toEqual({ offset: 4, line: 1, column: 5 });
    expect(positionAt(table, 9)).toEqual({ offset: 9, line: 2, column: 4 });
  });

  it('ignora o BOM na coluna e, com \\r\\n, dá as mesmas linhas que \\n sem BOM', () => {
    expect(positionAt(createLineTable('﻿uai x'), 1)).toEqual({ offset: 1, line: 1, column: 1 });
    expect(positionAt(createLineTable('﻿a\r\nb\r\nc'), 7).line).toBe(positionAt(createLineTable('a\nb\nc'), 4).line);
  });

  it('monta o Diagnostic com a posição do início', () => {
    const raw = { code: 'GS0401', start: 6, end: 11, args: { word: 'const' } };
    expect(toDiagnostic(raw, createLineTable('uai x\nconst y'))).toEqual({ code: 'GS0401', severity: 'error', line: 2, column: 1, args: { word: 'const' } });
  });
});
