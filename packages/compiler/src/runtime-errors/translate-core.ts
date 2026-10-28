import type { CoreDiagnostic, LineRange, RuntimeErrorContext } from '../api.types.ts';
import { toCoreDiagnostic } from '../diagnostics/core-report.ts';
import { createSourceText, offsetAt, positionAt } from '../source/source-text.ts';
import type { SourceText } from '../source/source.types.ts';
import { classifyRuntimeError, isErrorLike, loopLineOf } from './classify.ts';
import { originalPositionFor } from './original-position.ts';
import { parseStackFrames } from './stack-frames.ts';

interface OffsetRange { readonly start: number; readonly end: number }

const TRAILING_BREAK = /(?:\r\n|\r|\n)$/u;
const TOKEN_AT_START = /^(?:[\p{L}\p{N}_]+|\S)/u;
const EMPTY_RANGE: OffsetRange = { start: 0, end: 0 };

const isHelperLine = (line: number, helperRange: LineRange | null): boolean =>
  helperRange !== null && line >= helperRange.startLine && line <= helperRange.endLine;

function lineRange(source: SourceText, line: number): OffsetRange {
  const start = source.lineStarts[line - 1];
  if (start === undefined) return EMPTY_RANGE;
  const next = source.lineStarts[line] ?? source.text.length;
  return { start, end: start + source.text.slice(start, next).replace(TRAILING_BREAK, '').length };
}

function locate(error: unknown, context: RuntimeErrorContext, source: SourceText): OffsetRange {
  const loopLine = loopLineOf(error);
  if (loopLine !== undefined) return lineRange(source, loopLine);
  const stack = isErrorLike(error) && 'stack' in error ? error.stack : undefined;
  const frame = parseStackFrames(stack).find((candidate) => !isHelperLine(candidate.line, context.helperRange));
  if (frame === undefined) return EMPTY_RANGE;
  const original = context.map === null ? null : originalPositionFor(context.map, frame.line, frame.column - 1);
  if (original === null) return lineRange(source, frame.line);
  const start = offsetAt(source, original.line + 1, original.column + 1);
  return { start, end: start + (TOKEN_AT_START.exec(source.text.slice(start))?.[0].length ?? 0) };
}

export function translateRuntimeErrorCore(error: unknown, context: RuntimeErrorContext): CoreDiagnostic {
  const source = createSourceText(context.source, context.fileName);
  const { start, end } = locate(error, context, source);
  const args = { file: context.fileName, line: String(positionAt(source, start).line) };
  return toCoreDiagnostic({ code: classifyRuntimeError(error), start, end, args }, source);
}
