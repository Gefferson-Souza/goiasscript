import { describe, expect, it } from 'vitest';
import { compile } from '../src/compile.ts';
import { applyEdits } from '../src/emit.ts';
import { jsOf, parsesAsModule } from './support/compile-helpers.ts';

describe('keywords e ponto e vírgula', () => {
  it('troca a keyword pelo token JS e insere ; em instrução simples', () => {
    expect(jsOf('uai x é 1\ntrem y é 2\nprosa(x mais y)')).toBe('const x = 1;\nlet y = 2;\nconsole.log(x + y);');
  });

  it('não duplica o ; do aluno nem põe ; depois de instrução composta', () => {
    expect(jsOf('uai a é 1;\nse_ocê_quiser (a) {\n  prosa(a)\n}')).toBe('const a = 1;\nif (a) {\n  console.log(a);\n}');
  });

  it('põe ; depois de seta com bloco e de coisa literal, e não dentro do cabeçalho do vai_indo', () => {
    const js = jsOf('uai f é x => { faz_favor x }\nuai o é { a: 1 }\nvai_indo (trem i é 0; i menor_que 3; i é i mais 1) {\n  prosa(i)\n}');
    expect(js).toBe('const f = x => { return x; };\nconst o = { a: 1 };\nfor (let i = 0; i < 3; i = i + 1) {\n  console.log(i);\n}');
  });

  it('se_num_for vira else if e se_não vira else, nas linhas de origem', () => {
    expect(jsOf('se_ocê_quiser (a) {\n}\nse_num_for (b) {\n}\nse_não {\n}')).toBe('if (a) {\n}\nelse if (b) {\n}\nelse {\n}');
  });

  it('for-of, for-in, while, break e continue', () => {
    const js = jsOf('vai_indo (uai x de lista) {\n  para_com_isso\n}\nvai_indo (uai k em coisa) {\n  continua_aí\n}\nenquanto_tiver (certeza) {\n  para_com_isso\n}');
    expect(js).toBe('for (const x of lista) {\n  break;\n}\nfor (const k in coisa) {\n  continue;\n}\nwhile (true) {\n  break;\n}');
  });

  it('classe, herança, construtor, static, a_raiz, ocê, faz_um e async/await', () => {
    const source = 'arruma_trem Pequi inherda_de Fruta {\n  aprepara_trem(n) { a_raiz(n) }\n  num_muda criar() { faz_favor faz_um Pequi("verde") }\n  vai_na_frente busca() { espera_um_cadim ocê.achar() }\n}';
    expect(jsOf(source)).toBe('class Pequi extends Fruta {\n  constructor(n) { super(n); }\n  static criar() { return new Pequi("verde"); }\n  async busca() { await this.achar(); }\n}');
  });

  it('vai_na_frente_faz_trem vira async function; tenta_aí, se_der_ruim e por_fim viram try, catch e finally', () => {
    expect(jsOf('vai_na_frente faz_trem f() {\n}\nvai_na_frente_faz_trem g() {\n}')).toBe('async function f() {\n}\nasync function g() {\n}');
    expect(jsOf('tenta_aí {\n  prosa(1)\n} se_der_ruim (erro) {\n  prosa(2)\n} por_fim {\n  prosa(3)\n}')).toBe(
      'try {\n  console.log(1);\n} catch (erro) {\n  console.log(2);\n} finally {\n  console.log(3);\n}',
    );
  });
});

describe('biblioteca e nomes', () => {
  it('rebaixa globais e membros da biblioteca para o nativo', () => {
    expect(jsOf('uai d é lista.mapear(n => n vezes 2)\nprosa(d.tamanho)\nreclama("x")')).toBe(
      'const d = lista.map(n => n * 2);\nconsole.log(d.length);\nconsole.error("x");',
    );
  });

  it('palavra goiana como chave e como membro sai com a grafia original', () => {
    expect(jsOf('uai o é { de: "SP", mais: 1 }\nprosa(o.de, o.mais)')).toBe('const o = { de: "SP", mais: 1 };\nconsole.log(o.de, o.mais);');
  });

  it('vixe: mensagem embrulha em Error, faz_um e relançamento mantêm o erro', () => {
    expect(jsOf('vixe("a")')).toBe('throw new Error("a");');
    expect(jsOf('vixe(faz_um Erro("a"))')).toBe('throw (new Error("a"));');
    expect(jsOf('tenta_aí {\n  prosa(1)\n} se_der_ruim (erro) {\n  vixe(erro)\n}')).toContain('throw (erro);');
  });
});

describe('separação de tokens e arquivo', () => {
  it('não funde símbolo com o sinal seguinte: x menos-1 vira x - -1', () => {
    expect(jsOf('uai r é x menos-1')).toBe('const r = x - -1;');
    expect(jsOf('uai r é a mais -b')).toBe('const r = a + -b;');
    expect(jsOf('uai r é a menos - b')).toBe('const r = a - - b;');
  });

  it('omite o BOM e preserva \\r\\n', () => {
    expect(jsOf('﻿uai x é 1\r\nprosa(x)\r\n')).toBe('const x = 1;\r\nconsole.log(x);\r\n');
  });

  it('preserva o número de linhas e o JS sai válido para o acorn', () => {
    const source = 'uai x é [\n  1,\n  2,\n]\n\n// comentário\nlista.pra_cada(n => {\n  prosa(n)\n})\n';
    const code = jsOf(source);
    expect(code.split('\n')).toHaveLength(source.split('\n').length);
    expect(parsesAsModule(code)).toBe(true);
  });

  it('não emite código quando há erro', () => {
    const result = compile('uai x = 5');
    expect(result.ok).toBe(false);
    expect('code' in result).toBe(false);
  });

  it('applyEdits é linear: 50 mil edições em menos de 1 s', () => {
    const count = 50_000;
    const edits = Array.from({ length: count }, (_, index) => ({ start: index * 2, end: index * 2 + 1, text: 'bb', order: index }));
    const started = performance.now();
    expect(applyEdits('a '.repeat(count), edits)).toHaveLength(count * 3);
    expect(performance.now() - started).toBeLessThan(1000);
  });
});
