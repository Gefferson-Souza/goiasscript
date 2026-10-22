import { describe, expect, it } from 'vitest';
import { codes, parseText } from '../../support/parse.ts';

describe('parser: hábito de JavaScript', () => {
  it.each([
    ['const x é 1', ['GS0401']],
    ['uai x = 1', ['GS0404']],
    ['var x = 1', ['GS0401', 'GS0404']],
    ['function soma(a, b) { return a + b }', ['GS0401', 'GS0401']],
    ['se_ocê_quiser (a == b) { }', ['GS0404']],
    ['se_ocê_quiser (a === b && c || !d) { }', ['GS0404', 'GS0404', 'GS0404', 'GS0404']],
    ['i++', ['GS0404']],
    ['i += 1', ['GS0404']],
    ['uai x é 2 ** 3', ['GS0404']],
    ['if (a) { }', ['GS0401']],
  ])('%j dá %j', (text, expected) => {
    expect(codes(parseText(text))).toEqual(expected);
  });
  it('dá vários diagnósticos goianos no mesmo arquivo, na ordem, nunca exceção nem só o primeiro', () => {
    const text = 'var total = 0\nfunction soma(a, b) {\n  return a + b\n}\nif (total == 1) {\n  console.log(total);\n}\nprosa(lista.length);;';
    const result = parseText(text);
    const found = result.diagnostics.map((diagnostic) => diagnostic.code);
    expect(found.slice(0, 4)).toEqual(['GS0401', 'GS0404', 'GS0401', 'GS0401']);
    expect(found.length).toBeGreaterThanOrEqual(6);
    const starts = result.diagnostics.map((diagnostic) => diagnostic.start);
    expect(starts).toEqual([...starts].sort((left, right) => left - right));
  });
  it('não dá GS04xx para palavra goiana nem para nome comum', () => {
    expect(codes(parseText('uai lista é [1]\nuai e é 2\nuai fazer é 3'))).toEqual([]);
  });
});
