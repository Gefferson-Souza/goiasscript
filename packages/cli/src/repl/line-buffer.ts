import type { LineBuffer } from './line-buffer.types.ts';

export const EMPTY_LINE_BUFFER: LineBuffer = { lines: [] };

export const appendLine = (buffer: LineBuffer, line: string): LineBuffer => ({ lines: [...buffer.lines, line] });

export const isBufferEmpty = (buffer: LineBuffer): boolean => buffer.lines.length === 0;

export const bufferSource = (buffer: LineBuffer): string => buffer.lines.join('\n');
