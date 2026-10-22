import { describe, expect, it } from 'vitest';
import { parseStackFrames } from '../../../src/runtime-errors/stack-frames.ts';

describe('parseStackFrames', () => {
  it('lê frames com e sem função, base 1', () => {
    const stack = ['TypeError: x', '    at f (file:///tmp/a.mjs:3:9)', '    at file:///tmp/a.mjs:7:1', '    at async Promise.all (index 0)'].join('\n');
    expect(parseStackFrames(stack)).toEqual([
      { functionName: 'f', line: 3, column: 9 },
      { functionName: null, line: 7, column: 1 },
    ]);
  });
  it('stack ausente ou não-texto devolve lista vazia', () => {
    expect(parseStackFrames(undefined)).toEqual([]);
    expect(parseStackFrames(42)).toEqual([]);
  });
});
