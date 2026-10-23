import type { Diagnostic } from '@goiasscript/compiler';
import { MARKER_SEVERITY, MAX_MARKERS } from './diagnostic-markers.constants.ts';
import type { EditorMarker, LessonUrlOf, MarkerView } from './diagnostic-markers.types.ts';
import { toEditorRange } from './editor-position.ts';
import type { EditorRange } from './editor-position.types.ts';

const LINE_BREAK = /\r\n|\r|\n/u;

// Marcador de largura zero some no editor: sublinha o caractere seguinte ou, no fim da linha, o anterior.
function widen(range: EditorRange, lines: readonly string[]): EditorRange {
  if (range.startLineNumber !== range.endLineNumber || range.startColumn !== range.endColumn) return range;
  const lineLength = lines[range.startLineNumber - 1]?.length ?? 0;
  const atLineEnd = range.startColumn > lineLength && range.startColumn > 1;
  const startColumn = atLineEnd ? range.startColumn - 1 : range.startColumn;
  return { ...range, startColumn, endColumn: startColumn + 1 };
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
