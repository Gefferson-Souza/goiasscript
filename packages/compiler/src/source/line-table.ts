const BYTE_ORDER_MARK = 0xfeff;
const LINE_BREAK = /\r\n|\r|\n/gu;

// O BOM não conta como coluna: o editor não o mostra.
export function computeLineStarts(text: string): readonly number[] {
  const firstLineStart = text.codePointAt(0) === BYTE_ORDER_MARK ? 1 : 0;
  return [firstLineStart, ...[...text.matchAll(LINE_BREAK)].map((match) => match.index + match[0].length)];
}

export function lineIndexOf(lineStarts: readonly number[], offset: number): number {
  let low = 0;
  let high = lineStarts.length - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if ((lineStarts[middle] ?? 0) <= offset) low = middle;
    else high = middle - 1;
  }
  return low;
}
