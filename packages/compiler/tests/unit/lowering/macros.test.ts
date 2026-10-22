import { describe, expect, it } from 'vitest';
import { emit } from '../../support/lower.ts';

describe('macros e membros', () => {
  it.each([
    ['uai d é faz_um Data()\nprosa(d.mês() vezes 2)', 'const d = new Date();\nconsole.log((d.getMonth() + 1) * 2);'],
    ['uai m é Coisa.mistura({ a: 1 }, { b: 2 })', 'const m = Object.assign({}, { a: 1 }, { b: 2 });'],
    ['uai t é "ab"\nprosa(t.o_tanto)', 'const t = "ab";\nconsole.log(t.length);'],
    ['prosa(Conta.maior(1, 2))', 'console.log(Math.max(1, 2));'],
    ['prosa(Conta.PI)', 'console.log(Math.PI);'],
    ['uai x é "a"\nprosa(x.começa_com("a"))', 'const x = "a";\nconsole.log(x.startsWith("a"));'],
    ['uai l é [1]\nl.bota_no_final(2)\nl.ranca_o_rabo()', 'const l = [1];\nl.push(2);\nl.pop();'],
    ['daqui_um_cadim(() => { prosa(1) }, 5)', 'setTimeout(() => { console.log(1); }, 5);'],
  ])('%s', (src, js) => {
    expect(emit(src).code).toBe(js);
  });
  it.each([
    ['vai_na_frente_faz_trem f() { faz_favor 1 }', 'async function f() { return 1; }'],
    ['vai_na_frente faz_trem f() { faz_favor 1 }', 'async function f() { return 1; }'],
  ])('função assíncrona: %s', (src, js) => {
    expect(emit(src).code).toBe(js);
  });
  it('nome do aluno que esconde a biblioteca não é reescrito', () => {
    expect(emit('uai o é { mais: 1 }\nprosa(o.mais)').code).toBe('const o = { mais: 1 };\nconsole.log(o.mais);');
  });
});
