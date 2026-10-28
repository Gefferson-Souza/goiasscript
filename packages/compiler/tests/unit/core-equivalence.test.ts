import { describe, expect, it } from 'vitest';
import { compile } from '../../src/compile.ts';
import { compileCore } from '../../src/compile-core.ts';
import { formatCompileResult } from '../../src/diagnostics/format.ts';
import { translateRuntimeError } from '../../src/runtime-errors/translate.ts';
import { translateRuntimeErrorCore } from '../../src/runtime-errors/translate-core.ts';
import { formatDiagnostic } from '../../src/diagnostics/format.ts';
import type { Tone } from '../../src/api.types.ts';

const PROGRAMS = [
  'prosa("oi")',
  'uai a é nomi\nprosa(nome)',
  'uai x é 1\nx é 2',
  'faz_trem soma(a, b) { faz_favor a mais b }\nprosa(soma(1))',
  'prosa("aberto"',
  'var x = 1',
  'uai a é "texto"\nprosa(a.mapear)',
  '@@@',
];
const TONES: readonly Tone[] = ['raiz', 'neutro'];

describe('núcleo + formatação equivale à entrada principal', () => {
  for (const tone of TONES) {
    for (const program of PROGRAMS) {
      it(`compile(${JSON.stringify(program)}) no tom ${tone}`, () => {
        expect(formatCompileResult(compileCore(program, { tone }), tone)).toEqual(compile(program, { tone }));
      });
    }
  }
  it('o núcleo devolve diagnósticos sem texto', () => {
    const result = compileCore('uai a é nomi\nprosa(nome)');
    expect(result.diagnostics.length).toBeGreaterThan(0);
    for (const diagnostic of result.diagnostics) expect(Object.keys(diagnostic).toSorted()).toEqual(['args', 'code', 'range', 'severity']);
  });
  it('compile continua síncrono', () => {
    expect(compile('prosa(1)')).not.toBeInstanceOf(Promise);
  });
  for (const tone of TONES) {
    it(`translateRuntimeError no tom ${tone}`, () => {
      const context = { map: null, helperRange: null, fileName: 'p.gs', source: 'prosa(1)' };
      const error = new TypeError('x is not a function');
      expect(formatDiagnostic(translateRuntimeErrorCore(error, context), tone)).toEqual(translateRuntimeError(error, context, tone));
    });
  }
});
