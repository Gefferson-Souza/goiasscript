import { lookupDiagnostic } from '@goiasscript/language';
import { describe, expect, it } from 'vitest';
import { codes, parseText } from '../../support/parse.ts';

describe('parser: fora do subconjunto (§4.7)', () => {
  it.each([
    ['uai t é `oi ${1}`', ['GS0501']],
    ['uai r é /ab+/g', ['GS0502']],
    ['uai r é /"/', ['GS0502']],
    ['uai r é /a\\//', ['GS0502']],
    ['uai r é /=abc/', ['GS0502']],
    ['uai r é /abc', ['GS0502']],
    ['uai m é a / b / c', []],
    ['uai [a, b] é lista', ['GS0503']],
    ['uai { a } é coisa', ['GS0503']],
    ['prosa(...lista)', ['GS0504']],
    ['switch (x) { }', ['GS0505']],
    ['do { } while (certeza)', ['GS0506']],
    ['rotulo: prosa(1)', ['GS0507']],
    ['uai f é x => { a: x }', ['GS0507']],
    ['arruma_trem A {\n  get x() { faz_favor 1 }\n}', ['GS0508']],
    ['arruma_trem A {\n  x é 1\n}', ['GS0509']],
    ['arruma_trem A {\n  #x\n}', ['GS0510']],
    ['faz_trem* f() { }', ['GS0511']],
    ['prosa(typeof 1)', ['GS0512']],
    ['delete o.a', ['GS0513']],
    ['prosa(void 0)', ['GS0514']],
    ['import x from "y"', ['GS0515']],
    ['export uai x é 1', ['GS0515']],
    ['uai x: texto é "a"', ['GS0516']],
    ['uai n é 0xff', ['GS0517']],
    ['uai n é 1_000', ['GS0517']],
    ['uai n é 10n', ['GS0517']],
    ['uai f é faz_trem(x) { faz_favor x }', ['GS0518']],
    ['uai o é { x }', ['GS0519']],
    ['uai o é { f() { } }', ['GS0520']],
    ['uai o é { [k]: 1 }', ['GS0521']],
    ['uai x é a ?? b', ['GS0523']],
    ['uai x é a ? b : c', ['GS0523']],
    ['uai x é a?.b', ['GS0523']],
    ['debugger', ['GS0500']],
  ])('%j dá %j', (text, expected) => {
    expect(codes(parseText(text))).toEqual(expected);
  });
  it('todo código de subconjunto usado existe no catálogo, nos dois tons', () => {
    const used = [
      'GS0500', 'GS0501', 'GS0502', 'GS0503', 'GS0504', 'GS0505', 'GS0506', 'GS0507', 'GS0508', 'GS0509', 'GS0510', 'GS0511',
      'GS0512', 'GS0513', 'GS0514', 'GS0515', 'GS0516', 'GS0517', 'GS0518', 'GS0519', 'GS0520', 'GS0521', 'GS0523',
    ];
    expect(used.filter((code) => lookupDiagnostic(code) === undefined)).toEqual([]);
  });
});
