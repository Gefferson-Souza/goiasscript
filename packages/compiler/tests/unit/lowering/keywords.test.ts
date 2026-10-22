import { describe, expect, it } from 'vitest';
import { emit } from '../../support/lower.ts';

describe('keywords', () => {
  it.each([
    ['uai a é 1', 'const a = 1;'],
    ['trem a é 1', 'let a = 1;'],
    ['faz_trem f(a) { faz_favor a }', 'function f(a) { return a; }'],
    ['uai o é { de: "SP" }\nprosa(o.de)', 'const o = { de: "SP" };\nconsole.log(o.de);'],
    ['uai a é 1\nuai b é a mais 2 vezes 3 sobrou 4', 'const a = 1;\nconst b = a + 2 * 3 % 4;'],
    ['uai b é num_é certeza e_mais de_jeito_nenhum ou_então nada', 'const b = !true && false || null;'],
    ['uai o é { mais: 1 }\nprosa(o.mais)', 'const o = { mais: 1 };\nconsole.log(o.mais);'],
    [
      'se_ocê_quiser (certeza) { prosa(1) } se_num_for (certeza) { prosa(2) } se_não { prosa(3) }',
      'if (true) { console.log(1); } else if (true) { console.log(2); } else { console.log(3); }',
    ],
    [
      'tenta_aí { prosa(1) } se_der_ruim (e) { prosa(2) } por_fim { prosa(3) }',
      'try { console.log(1); } catch (e) { console.log(2); } finally { console.log(3); }',
    ],
    ['vai_indo (uai x de [1]) { prosa(x) }', 'for (const x of [1]) { console.log(x); }'],
    [
      'arruma_trem B {}\narruma_trem A inherda_de B { aprepara_trem(x) { a_raiz(x) } }',
      'class B {}\nclass A extends B { constructor(x) { super(x); } }',
    ],
    ['uai a é 1\nuai b é a é_igualim 1 e_mais a diferente 2', 'const a = 1;\nconst b = a === 1 && a !== 2;'],
    ['uai a é 3\nprosa(a pelo_menos 1 e_mais a no_máximo 5 e_mais a maior_que 0 e_mais a menor_que 9)', 'const a = 3;\nconsole.log(a >= 1 && a <= 5 && a > 0 && a < 9);'],
    ['uai a é 8\nuai b é a dividido 2 menos 1', 'const a = 8;\nconst b = a / 2 - 1;'],
    ['arruma_trem C { num_muda f() { faz_favor ocê } }', 'class C { static f() { return this; } }'],
  ])('%s', (src, js) => {
    expect(emit(src).code).toBe(js);
  });
});
