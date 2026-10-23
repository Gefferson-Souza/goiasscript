import type { RunLimits } from '../../config/run-limits.types.ts';
import type { AcceptedOutput, OutputBuffer } from './output-buffer.types.ts';

const LINE_BREAKS = /\r\n?/gu;
const ELLIPSIS = '…';
const HEX_RADIX = 16;
const DISCARDED: AcceptedOutput = { text: null, truncated: null };
// Controle (exceto \n e \t), marcas bidi e separadores de linha/parágrafo do Unicode.
const INVISIBLE_CONTROL = /(?![\n\t])[\p{Cc}\u{200e}\u{200f}\u{2028}\u{2029}\u{202a}-\u{202e}\u{2066}-\u{2069}]/gu;

const cutLine = (line: string, maxChars: number): string => (line.length > maxChars ? `${line.slice(0, maxChars)}${ELLIPSIS}` : line);

const countLines = (lines: readonly string[]): number => (lines.at(-1) === '' && lines.length > 1 ? lines.length - 1 : lines.length);

export function visibleText(text: string): string {
  return text.replace(INVISIBLE_CONTROL, (character) => `\\u{${(character.codePointAt(0) ?? 0).toString(HEX_RADIX)}}`);
}

export function createOutputBuffer(limits: RunLimits): OutputBuffer {
  let lineTotal = 0;
  let charTotal = 0;
  let closed = false;

  return {
    accept(text) {
      if (closed) return DISCARDED;
      const lines = text.replace(LINE_BREAKS, '\n').split('\n').map((line) => cutLine(line, limits.maxLineChars));
      const normalized = lines.join('\n');
      if (lineTotal + countLines(lines) > limits.maxLogLines) {
        closed = true;
        return { text: null, truncated: 'lines' };
      }
      if (charTotal + normalized.length > limits.maxLogChars) {
        closed = true;
        return { text: null, truncated: 'chars' };
      }
      lineTotal += countLines(lines);
      charTotal += normalized.length;
      return { text: normalized, truncated: null };
    },
  };
}
