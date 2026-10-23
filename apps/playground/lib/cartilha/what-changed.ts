import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CELL_SEPARATOR, TABLE_ROW, TABLE_SEPARATOR_ROW, WHAT_CHANGED_FILE_SEGMENTS, WHAT_CHANGED_LOAD_FAILURE } from './what-changed.constants.ts';
import type { MarkdownPart } from './what-changed.types.ts';

const cellsOf = (line: string): readonly string[] => line.trim().replace(/^\|/u, '').replace(/\|$/u, '').split(CELL_SEPARATOR).map((cell) => cell.trim());

export function loadWhatChanged(root: string = process.cwd()): string {
  try {
    return readFileSync(join(root, ...WHAT_CHANGED_FILE_SEGMENTS), 'utf8');
  } catch {
    throw new Error(WHAT_CHANGED_LOAD_FAILURE);
  }
}

const isTableStart = (lines: readonly string[], index: number): boolean => {
  const separator = lines[index + 1];
  return TABLE_ROW.test(lines[index] ?? '') && separator !== undefined && TABLE_SEPARATOR_ROW.test(separator);
};

const proseOf = (lines: readonly string[]): readonly MarkdownPart[] => (lines.join('').trim() === '' ? [] : [{ kind: 'prose', text: lines.join('\n') }]);

function tableAt(lines: readonly string[], start: number): { readonly part: MarkdownPart; readonly next: number } {
  const bodyStart = start + 2;
  const bodyLength = lines.slice(bodyStart).findIndex((line) => !TABLE_ROW.test(line));
  const next = bodyLength === -1 ? lines.length : bodyStart + bodyLength;
  return { part: { kind: 'table', header: cellsOf(lines[start] ?? ''), rows: lines.slice(bodyStart, next).map(cellsOf) }, next };
}

// O renderizador de Markdown não entende tabela; a tabela vira dado e o resto segue como prosa.
export function splitPipeTables(markdown: string): readonly MarkdownPart[] {
  const lines = markdown.split(/\r?\n/u);
  const tableStart = lines.findIndex((_, index) => isTableStart(lines, index));
  if (tableStart === -1) return proseOf(lines);
  const { part, next } = tableAt(lines, tableStart);
  return [...proseOf(lines.slice(0, tableStart)), part, ...splitPipeTables(lines.slice(next).join('\n'))];
}
