import type { LineRange } from '../api.types.ts';

const LINE_BREAK = /\r\n|\r|\n/gu;
const FIRST_HELPER_LINE_OFFSET = 2;

const lineBreaksIn = (text: string): number => Array.from(text.matchAll(LINE_BREAK)).length;

export function emitHelpers(code: string, sources: readonly string[]): { readonly code: string; readonly helperRange: LineRange | null } {
  if (sources.length === 0) return { code, helperRange: null };
  const appended = `${code}\n${sources.join('\n')}`;
  return { code: appended, helperRange: { startLine: lineBreaksIn(code) + FIRST_HELPER_LINE_OFFSET, endLine: lineBreaksIn(appended) + 1 } };
}
