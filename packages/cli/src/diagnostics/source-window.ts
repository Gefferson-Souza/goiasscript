import type { MarkedLine, SourceMarkRequest } from './source-window.types.ts';
import { BYTE_ORDER_MARK, CONTEXT_BEFORE, ELLIPSIS, LINE_BREAK, MAX_MARKED_COLUMNS, WINDOW_COLUMNS } from './render-diagnostic.constants.ts';
import { sanitizeForTerminal } from './sanitize-terminal.ts';

const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
const countGraphemes = (text: string): number => [...segmenter.segment(text)].length;
const LOW_SURROGATE = /^[\uDC00-\uDFFF]$/u;
const alignToPair = (text: string, index: number): number => (LOW_SURROGATE.test(text.charAt(index)) ? index - 1 : index);
const visible = (text: string): string => sanitizeForTerminal(text.replaceAll('\t', ' '));

export function lineOf(source: string, line: number): string | undefined {
  const withoutMark = source.startsWith(BYTE_ORDER_MARK) ? source.slice(1) : source;
  return withoutMark.split(LINE_BREAK)[line - 1];
}

export function markLine(text: string, request: SourceMarkRequest): MarkedLine {
  const start = Math.min(Math.max(request.column - 1, 0), text.length);
  const sameLine = request.endLine === request.line;
  const end = sameLine ? Math.min(Math.max(request.endColumn - 1, start), text.length) : text.length;
  const markedEnd = Math.min(end, start + MAX_MARKED_COLUMNS);
  if (text.length <= WINDOW_COLUMNS) return measure(text, start, markedEnd, false, false);
  const windowStart = alignToPair(text, Math.max(0, start - CONTEXT_BEFORE));
  const windowEnd = alignToPair(text, Math.min(text.length, windowStart + WINDOW_COLUMNS));
  return measure(text.slice(windowStart, windowEnd), start - windowStart, Math.min(markedEnd, windowEnd) - windowStart, windowStart > 0, windowEnd < text.length);
}

function measure(slice: string, start: number, end: number, cutBefore: boolean, cutAfter: boolean): MarkedLine {
  const lead = cutBefore ? ELLIPSIS : '';
  const trail = cutAfter ? ELLIPSIS : '';
  return {
    text: `${lead}${visible(slice)}${trail}`,
    padding: lead.length + countGraphemes(visible(slice.slice(0, start))),
    width: Math.max(countGraphemes(visible(slice.slice(start, end))), 1),
  };
}
