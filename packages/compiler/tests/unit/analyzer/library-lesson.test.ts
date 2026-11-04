import { describe, expect, it } from 'vitest';
import type { Diagnostic } from '../../../src/index.ts';
import { compile } from '../../../src/index.ts';

const diagnosticOf = (text: string, code: string): Diagnostic | undefined => compile(text).diagnostics.find((item) => item.code === code);

describe('lição de GS0604 e GS0603 pelo receptor', () => {
  it.each([
    ['uai l é [1]\nprosa(l.arruma(x => x, 2))', 'licao-06'],
    ['prosa(Coisa.chaves(1, 2))', 'licao-08'],
    ['prosa("a".trocar("x"))', 'licao-03'],
  ])('GS0604 em %j traz %s', (text, lesson) => {
    expect(diagnosticOf(text, 'GS0604')?.lesson).toBe(lesson);
  });

  it.each(['prosa(Conta.sorteia_um())', 'prosa(Conta.maior())', 'prosa(Conta.arredondar())'])('GS0604 em %j não traz lição', (text) => {
    const found = diagnosticOf(text, 'GS0604');
    expect(found).toBeDefined();
    expect(found !== undefined && Object.hasOwn(found, 'lesson')).toBe(false);
  });

  it('GS0603 de lista traz licao-06 e de Conta não traz lição', () => {
    expect(diagnosticOf('uai l é [1]\nprosa(l.o_tanto())', 'GS0603')?.lesson).toBe('licao-06');
    const found = diagnosticOf('prosa(Conta.PI())', 'GS0603');
    expect(found).toBeDefined();
    expect(found !== undefined && Object.hasOwn(found, 'lesson')).toBe(false);
  });
});
