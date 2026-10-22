import { originalPositionFor as oracle, TraceMap } from '@jridgewell/trace-mapping';
import { describe, expect, it } from 'vitest';
import { originalPositionFor } from '../../../src/runtime-errors/original-position.ts';
import { buildSourceMap } from '../../../src/sourcemap/source-map.ts';
import { createSourceText } from '../../../src/source/source-text.ts';
import { emit } from '../../support/lower.ts';

describe('originalPositionFor', () => {
  it('concorda com o trace-mapping em todas as colunas do JS gerado', () => {
    const text = 'uai total é 10\nprosa(total mais 1)';
    const out = emit(text);
    const map = buildSourceMap(createSourceText(text, 'programa.gs'), out.code, out.segments);
    const trace = new TraceMap(JSON.stringify(map));
    for (const [index, line] of out.code.split('\n').entries()) {
      for (let column = 0; column < line.length; column += 1) {
        const expected = oracle(trace, { line: index + 1, column });
        const actual = originalPositionFor(map, index + 1, column);
        expect(actual === null ? [null, null] : [actual.line + 1, actual.column]).toEqual([expected.line, expected.column]);
      }
    }
  });
});
