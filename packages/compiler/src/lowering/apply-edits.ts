import type { SourceText } from '../source/source.types.ts';
import type { Edit, MappingSegment } from './edit.types.ts';

interface Piece {
  readonly text: string;
  readonly originalOffset: number | null;
  readonly kind: MappingSegment['kind'];
}

export const compareEdits = (a: Edit, b: Edit): number =>
  a.start - b.start || Number(b.end === b.start) - Number(a.end === a.start) || a.order - b.order;

const copyPiece = (source: SourceText, from: number, to: number): readonly Piece[] =>
  from < to ? [{ text: source.text.slice(from, to), originalOffset: from, kind: 'copy' }] : [];

function piecesOf(source: SourceText, ordered: readonly Edit[]): readonly Piece[] {
  const edited = ordered.flatMap((edit, index): readonly Piece[] => {
    const cursor = index === 0 ? 0 : (ordered[index - 1]?.end ?? 0);
    if (edit.start < cursor) throw new Error(`edição se sobrepõe em ${String(edit.start)}`);
    const insertion = edit.start === edit.end;
    const replacement: Piece = { text: edit.text, originalOffset: insertion ? null : edit.start, kind: insertion ? 'insert' : 'replace' };
    return [...copyPiece(source, cursor, edit.start), replacement];
  });
  const tailStart = ordered.at(-1)?.end ?? 0;
  return [...edited, ...copyPiece(source, tailStart, source.text.length)];
}

// Pedaços + join: concatenar `code` a cada edição e ler o fim dela é quadrático.
export function applyEdits(source: SourceText, edits: readonly Edit[]): { readonly code: string; readonly segments: readonly MappingSegment[] } {
  const pieces = piecesOf(source, edits.toSorted(compareEdits)).filter((piece) => piece.text.length > 0);
  let generatedOffset = 0;
  const segments = pieces.map((piece): MappingSegment => {
    const segment = { generatedOffset, originalOffset: piece.originalOffset, length: piece.text.length, kind: piece.kind };
    generatedOffset += piece.text.length;
    return segment;
  });
  return { code: pieces.map((piece) => piece.text).join(''), segments };
}
