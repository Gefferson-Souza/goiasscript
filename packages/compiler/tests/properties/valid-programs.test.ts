import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { compile } from '../../src/compile.ts';

const VALID = [
  'uai a é 1\nprosa(a)', 'faz_trem f(x) {\n  faz_favor x mais 1\n}\nprosa(f(2))',
  'uai l é [3, 1, 2]\nprosa(l.arruma().ajunta(","))', 'vai_indo (trem i é 0; i menor_que 3; i é i mais 1) {\n  prosa(i)\n}',
] as const;
const SEMICOLON_PAIRS = [
  ['uai a é 1\nprosa(a)', 'uai a é 1;\nprosa(a);'],
  ['faz_trem f(x) {\n  faz_favor x mais 1\n}\nprosa(f(2))', 'faz_trem f(x) {\n  faz_favor x mais 1;\n}\nprosa(f(2));'],
] as const;
const terminators = fc.constantFrom('\n', '\r\n', '\r');
const jsLineCount = (code: string): number => code.split(/\r\n|\n|\r/).length;

describe('programas válidos (c)', () => {
  it('compile é determinístico', () => {
    fc.assert(fc.property(fc.constantFrom(...VALID), (text) => { expect(compile(text)).toEqual(compile(text)); }));
  });
  it('linhas do .gs preservadas com qualquer terminador; ajudantes só depois', () => {
    fc.assert(fc.property(fc.constantFrom(...VALID), terminators, (text, eol) => {
      const source = text.replace(/\n/g, eol);
      const result = compile(source);
      if (!result.ok) throw new Error('esperava ok');
      const gsLines = source.split(/\r\n|\n|\r/).length;
      const firstHelper = result.helperRange?.startLine ?? jsLineCount(result.code) + 1;
      expect(firstHelper).toBeGreaterThanOrEqual(gsLines);
    }));
  });
  it.each(SEMICOLON_PAIRS)('o ; opcional do aluno não altera o JS: %#', (without, withSemicolons) => {
    const a = compile(without);
    const b = compile(withSemicolons);
    if (!a.ok || !b.ok) throw new Error('esperava ok');
    expect(b.code).toBe(a.code);
  });
  it('recompor ou decompor NFC/NFD não muda a saída e a saída está em NFC', () => {
    fc.assert(fc.property(fc.constantFrom('café', 'ação', 'você'), fc.boolean(), (name, decompose) => {
      const written = decompose ? name.normalize('NFD') : name;
      const result = compile(`uai ${written} é 1\nprosa(${written})`);
      if (!result.ok) throw new Error('esperava ok');
      expect(result.code.normalize('NFC')).toBe(result.code);
      expect(result.code).toContain(name.normalize('NFC'));
    }));
  });
  it('alvos que não são módulo começam com use strict no offset 0', () => {
    fc.assert(fc.property(fc.constantFrom(...VALID), (text) => {
      const result = compile(text, { target: 'playground' });
      if (!result.ok) throw new Error('esperava ok');
      expect(result.code.startsWith("'use strict';")).toBe(true);
    }));
  });
  it('repl é determinístico e não muta a sessão recebida', () => {
    fc.assert(fc.property(fc.constantFrom(...VALID), (text) => {
      const session = { bindings: [{ name: 'k', kind: 'trem' as const }], members: [] };
      const before = JSON.stringify(session);
      expect(compile(text, { target: 'repl', session })).toEqual(compile(text, { target: 'repl', session }));
      expect(JSON.stringify(session)).toBe(before);
    }));
  });
  it('todo prefixo de programa válido compila ou falha com diagnóstico, nunca em silêncio', () => {
    for (const text of VALID) for (let cut = 1; cut < text.length; cut += 1) {
      const result = compile(text.slice(0, cut), { target: 'repl' });
      expect(result.ok || result.diagnostics.length > 0).toBe(true);
    }
  });
});
