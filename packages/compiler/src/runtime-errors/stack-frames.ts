import type { StackFrame } from './stack-frames.types.ts';

const FRAME = /^\s*at (?:(.+?) \()?(.+?):(\d+):(\d+)\)?$/u;
const STACK_LINE_BREAK = /\r\n|\n|\r/u;

export function parseStackFrames(stack: unknown): readonly StackFrame[] {
  if (typeof stack !== 'string') return [];
  return stack.split(STACK_LINE_BREAK).flatMap((row): readonly StackFrame[] => {
    const match = FRAME.exec(row);
    return match === null ? [] : [{ functionName: match[1] ?? null, line: Number(match[3]), column: Number(match[4]) }];
  });
}
