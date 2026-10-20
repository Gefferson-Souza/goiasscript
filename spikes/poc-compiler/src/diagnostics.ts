import type { Diagnostic, RawDiagnostic, SourcePosition } from './token.types.ts';

const BOM = '﻿';

export interface LineTable { readonly lineStarts: readonly number[]; readonly bomLength: number }

export function createLineTable(text: string): LineTable {
  const lineStarts = [0];
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '\r' && text[index + 1] === '\n') index += 1;
    if (char === '\n' || char === '\r') lineStarts.push(index + 1);
  }
  return { lineStarts, bomLength: text.startsWith(BOM) ? BOM.length : 0 };
}

// Busca binária do início da linha; offset, linha e coluna em unidades UTF-16.
export function positionAt(table: LineTable, offset: number): SourcePosition {
  let low = 0;
  let high = table.lineStarts.length - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if ((table.lineStarts[middle] ?? 0) <= offset) low = middle;
    else high = middle - 1;
  }
  const bomOffset = low === 0 ? table.bomLength : 0;
  return { offset, line: low + 1, column: offset - (table.lineStarts[low] ?? 0) + 1 - bomOffset };
}

export function toDiagnostic(raw: RawDiagnostic, table: LineTable): Diagnostic {
  const { line, column } = positionAt(table, raw.start);
  return { code: raw.code, severity: 'error', line, column, args: raw.args };
}
