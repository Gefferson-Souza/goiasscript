import type { Diagnostic } from '@goiasscript/compiler';
import { MARKER_SEVERITY, MAX_MARKERS } from './diagnostic-markers.constants.ts';
import type { EditorMarker, LessonUrlOf, MarkerView } from './diagnostic-markers.types.ts';
import { toEditorRange } from './editor-position.ts';
import type { EditorRange } from './editor-position.types.ts';

const LINE_BREAK = /\r\n|\r|\n/u;

const HIGH_SURROGATE = /[\uD800-\uDBFF]/u;
const LOW_SURROGATE = /[\uDC00-\uDFFF]/u;

function startsPair(line: string, index: number): boolean {
  return HIGH_SURROGATE.test(line.charAt(index)) && LOW_SURROGATE.test(line.charAt(index + 1));
}

// Marcador de largura zero some no editor: sublinha o caractere seguinte ou, no fim da linha, o anterior.
function widen(range: EditorRange, lines: readonly string[]): EditorRange {
  if (range.startLineNumber !== range.endLineNumber || range.startColumn !== range.endColumn) return range;
  const line = lines[range.startLineNumber - 1] ?? '';
  const atLineEnd = range.startColumn > line.length && range.startColumn > 1;
  const lastCharWidth = startsPair(line, line.length - 2) ? 2 : 1;
  const startColumn = atLineEnd ? range.startColumn - lastCharWidth : range.startColumn;
  const width = startsPair(line, startColumn - 1) ? 2 : 1;
  return { ...range, startColumn, endColumn: Math.max(startColumn + 1, Math.min(startColumn + width, line.length + 1)) };
}

function toMarker(diagnostic: Diagnostic, lines: readonly string[], lessonUrlOf: LessonUrlOf): EditorMarker {
  const lessonUrl = diagnostic.lesson === undefined ? undefined : lessonUrlOf(diagnostic.lesson);
  return {
    ...widen(toEditorRange(diagnostic.range), lines),
    code: diagnostic.code,
    severity: MARKER_SEVERITY[diagnostic.severity],
    message: diagnostic.help === undefined ? diagnostic.message : `${diagnostic.message}\n${diagnostic.help}`,
    ...(lessonUrl === undefined ? {} : { lessonUrl }),
  };
}

export function toEditorMarkers(diagnostics: readonly Diagnostic[], source: string, lessonUrlOf: LessonUrlOf): MarkerView {
  const lines = source.split(LINE_BREAK);
  const markers = diagnostics.slice(0, MAX_MARKERS).map((diagnostic) => toMarker(diagnostic, lines, lessonUrlOf));
  return { markers, hiddenMarkerCount: Math.max(0, diagnostics.length - MAX_MARKERS) };
}
