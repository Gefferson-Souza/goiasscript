import { describe, expect, it } from 'vitest';
import { analyzeSource } from '../../support/analyze.ts';

describe('censo de membros', () => {
  it.each([
    ['uai l é [1]\nl.some(x => x)', ['GS0405']],
    ['uai l é [1]\nl.map(x => x)', ['GS0405']],
    ['uai l é [1]\nl.flat(1)', ['GS0406']],
    ['uai p é { nome: "a" }\nprosa(p.nmoe)', ['GS0305']],
    ['uai p é { a: 1 }\nprosa(p.constructor)', ['GS0406']],
    ['uai p é { a: 1 }\nprosa(p.__proto__)', ['GS0406']],
    ['uai p é { length: 3 }', ['GS0405']],
    ['uai p é { constructor: 3 }', ['GS0406']],
    ['uai p é { new: 3 }', ['GS0401']],
    ['uai p é { public: 3 }', ['GS0402']],
    ['arruma_trem A { constructor() {} }', ['GS0406']],
    ['uai p é {}\np.prototype é 1', ['GS0406']],
    ['uai p é { a: 1 }\nprosa(p.default)', ['GS0402']],
    ['uai p é { a: 1 }\nprosa(p.new)', ['GS0401']],
  ])('%s', (src, expected) => {
    expect(analyzeSource(src).codes).toEqual(expected);
  });
  it('aceita membro declarado em qualquer ponto do arquivo (pré-passada)', () => {
    expect(analyzeSource('prosa(p.campo)\nuai p é { campo: 1 }').codes).toEqual([]);
    expect(analyzeSource('arruma_trem A { aprepara_trem() { ocê.x é 1 } }\nuai a é faz_um A()\nprosa(a.x)').codes).toEqual([]);
  });
  it('acesso por texto a nome da biblioteca avisa GS0809', () => {
    expect(analyzeSource('uai l é [1]\nprosa(l[0])\nprosa(l["mapear"])').codes).toEqual(['GS0809']);
  });
  it('acesso por texto a nome desconhecido dá GS0305', () => {
    expect(analyzeSource('uai p é { a: 1 }\nprosa(p["b"])').codes).toEqual(['GS0305']);
  });
  it('membros da biblioteca e estáticos são aceitos', () => {
    expect(analyzeSource('uai t é "a"\nprosa(t.gritando().o_tanto)\nprosa(Conta.maior(1, 2), Conta.PI)').codes).toEqual([]);
  });
  it('estático inexistente em Conta sugere o mais parecido', () => {
    const { analysis } = analyzeSource('prosa(Conta.maiar(1, 2))');
    expect(analysis.diagnostics[0]).toMatchObject({ code: 'GS0305', args: { name: 'maiar', suggestion: 'maior' } });
  });
  it('receptor não resolvido não gera diagnóstico de membro', () => {
    expect(analyzeSource('prosa(zzz.campo)').codes).toEqual(['GS0301']);
    expect(analyzeSource('console.log(1)').codes).toEqual(['GS0403']);
  });
  it('cadeia com membro inválido não repete o erro nos próximos elos', () => {
    expect(analyzeSource('uai p é { a: 1 }\nprosa(p.b.c.d)').codes).toEqual(['GS0305']);
    expect(analyzeSource('prosa(zzz.b.c)').codes).toEqual(['GS0301']);
  });
  it('a_raiz.metodo não passa pelo censo', () => {
    const text = 'arruma_trem B { oi() {} }\narruma_trem A inherda_de B { oi() { a_raiz.oi() } }';
    expect(analyzeSource(text).codes).toEqual([]);
  });
  it('GS0305 sugere por distância sobre D e biblioteca', () => {
    const { analysis } = analyzeSource('uai p é { nome: 1 }\nprosa(p.nmoe)');
    expect(analysis.diagnostics[0]?.args).toMatchObject({ name: 'nmoe', suggestion: 'nome' });
  });
  it('GS0405 leva o nome goiano de sugestão', () => {
    const { analysis } = analyzeSource('uai l é [1]\nl.map(x => x)');
    expect(analysis.diagnostics[0]?.args).toEqual({ name: 'map', suggestion: 'mapear' });
  });
  it('declaredMembers expõe o censo D', () => {
    expect([...analyzeSource('uai p é { a: 1, "b": 2, 3: 4 }\np.c é 3').analysis.declaredMembers].sort()).toEqual(['3', 'a', 'b', 'c']);
  });
  it('construtor não entra em D', () => {
    expect([...analyzeSource('arruma_trem A { aprepara_trem() {} soma() {} static_x() {} }').analysis.declaredMembers].sort()).toEqual(['soma', 'static_x']);
  });
});
