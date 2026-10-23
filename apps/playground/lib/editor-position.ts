import type { SourceRange } from '@goiasscript/compiler';
import type { EditorRange } from './editor-position.types.ts';

// O compilador já conta linha e coluna base 1 em unidades UTF-16, igual ao Monaco; o que muda é só o nome dos campos.
export function toEditorRange(range: SourceRange): EditorRange {
  return {
    startLineNumber: range.start.line,
    startColumn: range.start.column,
    endLineNumber: range.end.line,
    endColumn: range.end.column,
  };
}
