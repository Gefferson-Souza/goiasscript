import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { compile } from '../src/compile.ts';

const ERRORS_DIRECTORY = join(import.meta.dirname, '..', 'fixtures', 'typical-errors');
const load = (name: string): string => readFileSync(join(ERRORS_DIRECTORY, `${name}.gs`), 'utf8');

const TYPICAL_ERRORS = [
  ['assign-equals', 'GS0404', 2],
  ['js-const', 'GS0401', 1],
  ['js-console', 'GS0403', 2],
  ['decimal-comma', 'GS0208', 2],
  ['leading-zero', 'GS0101', 2],
  ['unterminated-string', 'GS0103', 1],
  ['braceless-body', 'GS0207', 2],
  ['leading-operator', 'GS0203', 2],
  ['dangling-else', 'GS0205', 2],
  ['unexpected-eof', 'GS0201', 3],
] as const;

describe('10 erros típicos de quem vem do JavaScript', () => {
  it.each(TYPICAL_ERRORS)('%s dá %s na linha %i, sem lançar', (name, code, line) => {
    const result = compile(load(name));
    expect(result.ok).toBe(false);
    expect(result.diagnostics.find((diagnostic) => diagnostic.code === code)?.line).toBe(line);
  });

  it('um arquivo com vários erros devolve pelo menos 3 códigos distintos', () => {
    const result = compile(load('multi-error'));
    expect(result.ok).toBe(false);
    expect([...new Set(result.diagnostics.map((diagnostic) => diagnostic.code))].sort()).toEqual(['GS0208', 'GS0401', 'GS0403', 'GS0404']);
    expect(result.diagnostics.map((diagnostic) => diagnostic.line)).toEqual([1, 2, 3, 5, 6]);
  });
});
