import type { Diagnostic } from '@goiasscript/compiler';
import type { AnyDiagnostic, RenderRequest } from './diagnostic.types.ts';
import { GUTTER_SEPARATOR, SEVERITY_LABEL } from './render-diagnostic.constants.ts';
import { sanitizeForTerminal } from './sanitize-terminal.ts';
import { markLine, splitSourceLines } from './source-window.ts';

export { sanitizeForTerminal } from './sanitize-terminal.ts';
export { splitSourceLines } from './source-window.ts';

const hasRange = (diagnostic: AnyDiagnostic): diagnostic is Diagnostic => 'range' in diagnostic;

function codeLines(diagnostic: Diagnostic, lines: readonly string[] | null): readonly string[] {
  const { start, end } = diagnostic.range;
  const text = lines?.[start.line - 1];
  if (text === undefined) return [];
  const marked = markLine(text, { line: start.line, column: start.column, endLine: end.line, endColumn: end.column });
  const number = String(start.line);
  const blank = ' '.repeat(number.length);
  return [`${number}${GUTTER_SEPARATOR}${marked.text}`, `${blank}${GUTTER_SEPARATOR}${' '.repeat(marked.padding)}${'^'.repeat(marked.width)}`];
}

function header(diagnostic: AnyDiagnostic, fileName: string): string {
  const label = `${SEVERITY_LABEL[diagnostic.severity]} ${diagnostic.code}: ${sanitizeForTerminal(diagnostic.message)}`;
  if (!hasRange(diagnostic)) return label;
  const { line, column } = diagnostic.range.start;
  return `${sanitizeForTerminal(fileName)}:${String(line)}:${String(column)}: ${label}`;
}

export function renderDiagnostic(request: RenderRequest): string {
  const { diagnostic } = request;
  const lines = request.lines ?? (request.source === null ? null : splitSourceLines(request.source));
  const detail = !hasRange(diagnostic) && diagnostic.detail !== undefined ? [`  ${sanitizeForTerminal(diagnostic.detail)}`] : [];
  const lesson = hasRange(diagnostic) && diagnostic.lesson !== undefined ? [`  lição: ${sanitizeForTerminal(diagnostic.lesson)}`] : [];
  return [
    header(diagnostic, request.fileName),
    ...(hasRange(diagnostic) ? codeLines(diagnostic, lines) : []),
    ...detail,
    ...(diagnostic.help === undefined ? [] : [`  ajuda: ${sanitizeForTerminal(diagnostic.help)}`]),
    ...lesson,
  ].join('\n');
}
