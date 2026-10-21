import type { SourcePosition, SourceRange } from '../api.types.ts';
import { computeLineStarts, lineIndexOf } from './line-table.ts';
import type { SourceText } from './source.types.ts';

export function createSourceText(text: string, fileName: string): SourceText {
  return { text, fileName, lineStarts: computeLineStarts(text) };
}

export function positionAt(source: SourceText, offset: number): SourcePosition {
  const clamped = Math.min(Math.max(offset, 0), source.text.length);
  const index = lineIndexOf(source.lineStarts, clamped);
  const lineStart = source.lineStarts[index] ?? 0;
  return { offset: clamped, line: index + 1, column: Math.max(clamped - lineStart, 0) + 1 };
}

export function rangeOf(source: SourceText, start: number, end: number): SourceRange {
  return { start: positionAt(source, start), end: positionAt(source, end) };
}

export function offsetAt(source: SourceText, line: number, column: number): number {
  const lineStart = source.lineStarts[line - 1] ?? source.text.length;
  return Math.min(lineStart + column - 1, source.text.length);
}
