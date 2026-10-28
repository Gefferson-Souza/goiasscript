import { describe, expect, it } from 'vitest';
import { analyzeSource } from '../../support/analyze.ts';

const codesOf = (text: string): readonly string[] => analyzeSource(text).codes;

describe('o analisador visita todas as partes das construções', () => {
  it.each([
    ['teste do enquanto_tiver', 'enquanto_tiver (zz) { prosa(1) }'],
    ['argumento do vixe', 'vixe(zz)'],
    ['argumento do faz_favor', 'faz_trem f() { faz_favor zz }'],
    ['valor de propriedade de coisa', 'uai o é { a: zz }\nprosa(o)'],
    ['superclasse', 'arruma_trem A inherda_de zz {}'],
    ['início do vai_indo', 'vai_indo (zz é 0; certeza; ) { para_com_isso }'],
    ['teste do vai_indo', 'vai_indo (trem i é 0; zz; ) { para_com_isso }'],
    ['atualização do vai_indo', 'vai_indo (trem i é 0; i menor_que 3; zz é 1) { prosa(i) }'],
    ['lista do vai_indo de', 'vai_indo (uai x de zz) { prosa(x) }'],
    ['lista do vai_indo em', 'vai_indo (uai x em zz) { prosa(x) }'],
    ['corpo do vai_indo em', 'vai_indo (uai x em [1]) { prosa(zz) }'],
    ['propriedade calculada de membro', 'uai o é { a: 1 }\nprosa(o[zz])'],
    ['propriedade calculada de atribuição', 'uai o é { a: 1 }\no[zz] é 1'],
    ['propriedade calculada de a_raiz', 'arruma_trem B { oi() {} }\narruma_trem A inherda_de B { oi() { a_raiz[zz] } }'],
    ['propriedade calculada de a_raiz atribuída', 'arruma_trem B { oi() {} }\narruma_trem A inherda_de B { oi() { a_raiz[zz] é 1 } }'],
    ['valor da atribuição', 'trem a é 1\na é zz'],
    ['elemento de lista', 'prosa([zz])'],
    ['argumento de faz_um', 'arruma_trem A {}\nfaz_um A(zz)'],
    ['operando esquerdo de e_mais', 'prosa(zz e_mais certeza)'],
    ['operando direito de ou_então', 'prosa(certeza ou_então zz)'],
    ['operando de num_é', 'prosa(num_é zz)'],
    ['objeto da atribuição de membro', 'zz.campo é 1'],
    ['bloco do por_fim', 'tenta_aí { prosa(1) } por_fim { prosa(zz) }'],
    ['bloco do se_der_ruim', 'tenta_aí { prosa(1) } se_der_ruim (e) { prosa(zz) }'],
  ])('%s', (_title, text) => {
    expect(codesOf(text)).toContain('GS0301');
  });

  it('trem sem valor é aceito, só uai exige valor', () => {
    expect(codesOf('trem x\nx é 1')).toEqual([]);
    expect(codesOf('uai x')).toEqual(['GS0307']);
  });
  it('tenta_aí só com por_fim é aceito', () => {
    expect(codesOf('tenta_aí { prosa(1) } por_fim { prosa(2) }')).toEqual([]);
  });
  it('vai_indo com início por atribuição é aceito', () => {
    expect(codesOf('trem i é 0\nvai_indo (i é 0; i menor_que 3; i é i mais 1) { prosa(i) }')).toEqual([]);
  });
  it('uai sem valor no vai_indo clássico dá GS0307, mas no vai_indo de não', () => {
    expect(codesOf('vai_indo (uai x; certeza; ) { para_com_isso }')).toContain('GS0307');
    expect(codesOf('vai_indo (uai x de [1]) { prosa(x) }')).toEqual([]);
    expect(codesOf('vai_indo (uai x em [1]) { prosa(x) }')).toEqual([]);
  });
  it('variável do vai_indo não vaza para fora do laço', () => {
    expect(codesOf('vai_indo (trem i é 0; i menor_que 1; i é i mais 1) { prosa(i) }\nprosa(i)')).toEqual(['GS0301']);
  });
  it('função declarada depois do uso vale dentro do se_der_ruim', () => {
    expect(codesOf('tenta_aí { prosa(1) } se_der_ruim (e) { prosa(dobro(2))\nfaz_trem dobro(n) { faz_favor n } }')).toEqual([]);
  });
  it('parâmetro do se_der_ruim repetido no corpo dá GS0304', () => {
    expect(codesOf('tenta_aí { prosa(1) } se_der_ruim (e) { uai e é 1 }')).toEqual(['GS0304']);
  });
  it('const dentro do vai_indo de com valor é aceito', () => {
    expect(codesOf('vai_indo (uai x de [1, 2]) { uai y é x\nprosa(y) }')).toEqual([]);
  });
});

describe('contexto de laço e de função', () => {
  it('sair do laço volta ao contexto sem laço', () => {
    expect(codesOf('enquanto_tiver (certeza) { para_com_isso }\npara_com_isso')).toEqual(['GS0308']);
    expect(codesOf('vai_indo (uai x de [1]) { prosa(x) }\ncontinua_aí')).toEqual(['GS0308']);
  });
  it('laços aninhados: sair do interno continua dentro do externo', () => {
    const text = 'enquanto_tiver (certeza) { enquanto_tiver (certeza) { para_com_isso }\npara_com_isso }';
    expect(codesOf(text)).toEqual([]);
  });
  it('sair de uma função devolve o contexto de fora', () => {
    expect(codesOf('faz_trem f() { faz_favor 1 }\nfaz_favor 2')).toEqual(['GS0309']);
    expect(codesOf('faz_trem f() { faz_favor 1 }\nespera_um_cadim cochila(1)')).toEqual([]);
    expect(codesOf('vai_na_frente faz_trem f() { faz_favor 1 }\nfaz_trem g() { espera_um_cadim cochila(1) }')).toEqual(['GS0312']);
  });
  it('laço dentro de função não vaza o contexto de laço nem de função para o topo', () => {
    const text = 'faz_trem f() { enquanto_tiver (certeza) { para_com_isso } }\npara_com_isso\nfaz_favor 1';
    expect(codesOf(text)).toEqual(['GS0308', 'GS0309']);
  });
  it('depois de uma função com laço dentro, o laço de fora continua valendo', () => {
    const text = 'enquanto_tiver (certeza) { faz_trem f() { enquanto_tiver (certeza) { para_com_isso } }\npara_com_isso }';
    expect(codesOf(text)).toEqual([]);
  });
});

describe('a_raiz e ocê em classes', () => {
  const PARENT = 'arruma_trem B { oi() {} }\n';

  it('a_raiz.x como alvo de atribuição em método de classe que herda é aceito', () => {
    expect(codesOf(`${PARENT}arruma_trem A inherda_de B { oi() { a_raiz.x é 1 } }`)).toEqual([]);
  });
  it('a_raiz.x como alvo de atribuição fora de classe dá GS0311', () => {
    expect(codesOf('faz_trem f() { a_raiz.x é 1 }')).toContain('GS0311');
  });
  it('função dentro de método não herda o direito de usar a_raiz', () => {
    const text = `${PARENT}arruma_trem A inherda_de B { m() { faz_trem g() { a_raiz.oi() } } }`;
    expect(codesOf(text)).toEqual(['GS0311']);
  });
  it('ocê dentro de seta conta como uso no construtor', () => {
    const text = `${PARENT}arruma_trem A inherda_de B { aprepara_trem() { uai f é () => ocê.x\na_raiz() } }`;
    expect(codesOf(text)).toContain('GS0311');
  });
  it('ocê dentro de função aninhada não impede a_raiz() no construtor', () => {
    const text = `${PARENT}arruma_trem A inherda_de B { aprepara_trem() { faz_trem g() { faz_favor ocê }\na_raiz() } }`;
    expect(codesOf(text)).toEqual([]);
  });
  it('depois de usar ocê, laço e await do método continuam valendo', () => {
    const loop = 'arruma_trem A { m() { ocê.x é 1\nenquanto_tiver (certeza) { ocê.x é 2\npara_com_isso } } }';
    expect(codesOf(loop)).toEqual([]);
    const awaited = 'arruma_trem A { vai_na_frente m() { ocê.x é 1\nespera_um_cadim cochila(1) } }';
    expect(codesOf(awaited)).toEqual([]);
  });
  it('construtor duplicado é achado mesmo com classe aninhada no meio', () => {
    const text = 'arruma_trem P { aprepara_trem() {} m() { arruma_trem Q { aprepara_trem() {} } } aprepara_trem() {} }';
    const found = analyzeSource(text).analysis.diagnostics.filter((item) => item.code === 'GS0310');
    expect(found).toHaveLength(1);
    expect(found[0]?.start).toBe(text.lastIndexOf('aprepara_trem'));
  });
  it('construtor de classe aninhada não conta para a classe de fora', () => {
    const text = 'arruma_trem P { m() { arruma_trem Q { n() { arruma_trem R {} } aprepara_trem() {} } } aprepara_trem() {} }';
    expect(codesOf(text)).toEqual([]);
  });
  it('classes irmãs podem ter um construtor cada', () => {
    expect(codesOf('arruma_trem P { aprepara_trem() {} }\narruma_trem Q { aprepara_trem() {} }')).toEqual([]);
  });
});
