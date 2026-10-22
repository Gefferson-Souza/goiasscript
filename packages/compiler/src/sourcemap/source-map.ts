import type { MappingSegment } from '../lowering/edit.types.ts';
import { toMappingPosition } from '../source/position-convert.ts';
import { createSourceText, positionAt } from '../source/source-text.ts';
import type { SourceText } from '../source/source.types.ts';
import { SOURCE_MAP_VERSION } from './source-map.constants.ts';
import type { SourceMapV3 } from './source-map.types.ts';
import { encodeVlq } from './vlq.ts';

const TOKEN_PATTERN = /[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu;
const SOURCE_EXTENSION = /\.gs$/iu;
const EMITTED_EXTENSION = '.mjs';
const SOURCE_INDEX_DELTA = 0;
const LINE_SEPARATOR = ';';
const FIELD_SEPARATOR = ',';

interface Piece {
  readonly generatedOffset: number;
  readonly originalOffset: number | null;
}

function expandSegments(source: SourceText, segments: readonly MappingSegment[]): readonly Piece[] {
  return segments.flatMap((segment): readonly Piece[] => {
    if (segment.kind === 'insert') return [{ generatedOffset: segment.generatedOffset, originalOffset: null }];
    if (segment.originalOffset === null || segment.length === 0) return [];
    const original = segment.originalOffset;
    if (segment.kind === 'replace') return [{ generatedOffset: segment.generatedOffset, originalOffset: original }];
    const copied = source.text.slice(original, original + segment.length);
    return Array.from(copied.matchAll(TOKEN_PATTERN), (match) => ({
      generatedOffset: segment.generatedOffset + match.index,
      originalOffset: original + match.index,
    }));
  });
}

const separatorBefore = (index: number, line: number, previousLine: number): string => {
  if (index === 0) return LINE_SEPARATOR.repeat(line);
  return line === previousLine ? FIELD_SEPARATOR : LINE_SEPARATOR.repeat(line - previousLine);
};

// Acumuladores primitivos: copiar um objeto de estado a cada mapeamento tornaria o mapa quadrático.
function encodeMappings(source: SourceText, generated: SourceText, pieces: readonly Piece[]): string {
  let previousLine = 0;
  let previousColumn = 0;
  let sourceLine = 0;
  let sourceColumn = 0;
  const entries = pieces.map((piece, index) => {
    const target = toMappingPosition(positionAt(generated, piece.generatedOffset));
    const sameLine = index > 0 && target.line === previousLine;
    const columnDelta = sameLine ? target.column - previousColumn : target.column;
    const separator = separatorBefore(index, target.line, previousLine);
    previousLine = target.line;
    previousColumn = target.column;
    if (piece.originalOffset === null) return `${separator}${encodeVlq(columnDelta)}`;
    const original = toMappingPosition(positionAt(source, piece.originalOffset));
    const fields = [columnDelta, SOURCE_INDEX_DELTA, original.line - sourceLine, original.column - sourceColumn];
    sourceLine = original.line;
    sourceColumn = original.column;
    return `${separator}${fields.map(encodeVlq).join('')}`;
  });
  const trailing = LINE_SEPARATOR.repeat(generated.lineStarts.length - 1 - previousLine);
  return `${entries.join('')}${trailing}`;
}

export function buildSourceMap(source: SourceText, generatedCode: string, segments: readonly MappingSegment[]): SourceMapV3 {
  const generated = createSourceText(generatedCode, source.fileName);
  return {
    version: SOURCE_MAP_VERSION,
    file: source.fileName.replace(SOURCE_EXTENSION, EMITTED_EXTENSION),
    sources: [source.fileName],
    sourcesContent: [source.text],
    names: [],
    mappings: encodeMappings(source, generated, expandSegments(source, segments)),
  };
}
