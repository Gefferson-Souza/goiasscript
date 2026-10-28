import { describe, expect, it } from 'vitest';
import type { AstNode } from '../../../src/ast/ast.types.ts';
import { forEachChild } from '../../../src/ast/walk.ts';
import { GONE_PHRASE } from '../../../src/parser/subset.constants.ts';
import { analyzeSource } from '../../support/analyze.ts';

function firstArgs(text: string, code: string): Readonly<Record<string, unknown>> | undefined {
  return analyzeSource(text).analysis.diagnostics.find((item) => item.code === code)?.args;
}

function memberKinds(text: string, property: string): readonly string[] {
  const { analysis, parsed } = analyzeSource(text);
  const kinds: string[] = [];
  const visit = (node: AstNode): void => {
    if (node.type === 'MemberExpression' && !node.computed && node.property.type === 'Identifier' && node.property.name === property) {
      kinds.push(analysis.resolutionOf(node).kind);
    }
    forEachChild(node, visit);
  };
  visit(parsed.program);
  return kinds;
}

describe('argumentos dos diagnósticos de nome', () => {
  it('palavra aposentada com substituto traz o substituto', () => {
    expect(firstArgs('prosa(vazio)', 'GS0306')).toStrictEqual({ word: 'vazio', replacement: 'nada' });
  });
  it('palavra aposentada sem substituto traz a frase de saída', () => {
    expect(firstArgs('prosa(mexe_assim)', 'GS0306')).toStrictEqual({ word: 'mexe_assim', gone: GONE_PHRASE });
  });
  it('palavra do JavaScript sem equivalente usada como nome traz a sugestão', () => {
    expect(firstArgs('prosa(eval)', 'GS0402')).toStrictEqual({ name: 'eval', suggestion: 'avaliar' });
    expect(firstArgs('prosa(public)', 'GS0402')).toStrictEqual({ name: 'public', suggestion: 'publico' });
  });
  it('global do JavaScript usada como nome traz a sugestão', () => {
    expect(firstArgs('prosa(console)', 'GS0403')).toStrictEqual({ name: 'console', suggestion: 'prosa' });
  });
  it('palavra reservada do JavaScript sem equivalente usada como nome traz a sugestão', () => {
    expect(firstArgs('prosa(implements)', 'GS0402')).toStrictEqual({ name: 'implements', suggestion: 'implementacao' });
  });
  it('palavra reservada da linguagem usada como nome não gera aviso de nome não declarado', () => {
    expect(analyzeSource('prosa(mais)').codes).toEqual([]);
  });
  it('nome não declarado sem parecido vem só com o nome', () => {
    expect(firstArgs('prosa(zzzzzz)', 'GS0301')).toStrictEqual({ name: 'zzzzzz' });
  });
  it('nome não declarado com parecido traz a sugestão', () => {
    expect(firstArgs('uai nome é 1\nprosa(nomi)', 'GS0301')).toStrictEqual({ name: 'nomi', suggestion: 'nome' });
  });
  it('reatribuir constante traz o nome', () => {
    expect(firstArgs('uai a é 1\na é 2', 'GS0302')).toStrictEqual({ name: 'a' });
  });
});

describe('argumentos dos diagnósticos de declaração', () => {
  it('nome declarado de palavra sem equivalente e de global trazem a sugestão', () => {
    expect(firstArgs('uai eval é 1', 'GS0402')).toStrictEqual({ name: 'eval', suggestion: 'avaliar' });
    expect(firstArgs('uai console é 1', 'GS0403')).toStrictEqual({ name: 'console', suggestion: 'prosa' });
  });
  it('chave de coisa com nome de global ou de palavra sem equivalente não reclama', () => {
    expect(analyzeSource('uai o é { eval: 1, console: 2, NaN: 3 }').codes).toEqual([]);
  });
  it('membro do JavaScript sem nome goiano traz só o nome; com alternativa traz as duas', () => {
    expect(firstArgs('uai o é { a: 1 }\nprosa(o.constructor)', 'GS0406')).toStrictEqual({ name: 'constructor' });
    expect(firstArgs('uai o é { a: 1 }\nprosa(o.hasOwnProperty)', 'GS0406')).toStrictEqual({ name: 'hasOwnProperty', alternative: 'Coisa.tem' });
  });
  it('membro desconhecido traz a sugestão só quando há parecido', () => {
    expect(firstArgs('uai o é { nome: 1 }\nprosa(o.nmoe)', 'GS0305')).toStrictEqual({ name: 'nmoe', suggestion: 'nome' });
    expect(firstArgs('uai o é { nome: 1 }\nprosa(o.zzzzzzzz)', 'GS0305')).toStrictEqual({ name: 'zzzzzzzz' });
  });
});

describe('argumentos dos diagnósticos da biblioteca', () => {
  it('propriedade chamada com parênteses traz o nome curto do membro', () => {
    expect(firstArgs('prosa(Conta.PI())', 'GS0603')).toStrictEqual({ name: 'PI', expected: 'é propriedade e não leva parênteses' });
  });
  it('método usado como valor traz o nome curto do membro', () => {
    expect(firstArgs('prosa(Conta.maior)', 'GS0603')).toStrictEqual({ name: 'maior', expected: 'é método e precisa de parênteses' });
  });
  it('assinatura usa o máximo de argumentos, ou o mínimo quando não há máximo', () => {
    expect(firstArgs('prosa(Conta.maior())', 'GS0604')).toStrictEqual({ name: 'maior', arity: 'pelo menos 1', received: '0', signature: 'maior(valor)' });
    expect(firstArgs('uai t é "a"\nt.naco()', 'GS0604')).toMatchObject({ arity: 'de 1 a 2 argumentos', signature: 'naco(valor, valor)' });
  });
  it('chamada com a quantidade certa de argumentos não avisa', () => {
    expect(analyzeSource('prosa(Conta.maior(1, 2, 3))').codes).toEqual([]);
    expect(analyzeSource('uai t é "a"\nprosa(t.naco(1), t.naco(1, 2))').codes).toEqual([]);
  });
  it('reserva por forma descreve o receptor e sugere nome novo', () => {
    expect(firstArgs('uai o é { o_tanto: 1 }', 'GS0601')).toMatchObject({ name: 'o_tanto', description: 'o_tanto de texto e de lista' });
  });
});

describe('resolução de membros', () => {
  it('a_raiz.metodo fica sem resolução, mesmo com índice calculado', () => {
    const text = 'arruma_trem B { oi() {} }\narruma_trem A inherda_de B { oi() { a_raiz.oi() } }';
    expect(memberKinds(text, 'oi')).toContain('unresolved');
    expect(memberKinds(text, 'oi').every((kind) => kind === 'unresolved' || kind === 'program')).toBe(true);
  });
  it('a_raiz.x atribuído em método fica sem resolução', () => {
    const text = 'arruma_trem B {}\narruma_trem A inherda_de B { oi() { a_raiz.campo } }';
    expect(memberKinds(text, 'campo')).toEqual(['unresolved']);
  });
  it('membro de receptor inválido fica sem resolução', () => {
    expect(memberKinds('prosa(zz.campo)', 'campo')).toEqual(['unresolved']);
    expect(memberKinds('uai o é { a: 1 }\nprosa(o.b.campo)', 'campo')).toEqual(['unresolved']);
  });
  it('membro desconhecido não resolve, nem em namespace da biblioteca', () => {
    expect(memberKinds('uai o é { a: 1 }\nprosa(o.zzzzzzzz)', 'zzzzzzzz')).toEqual(['unresolved']);
    expect(memberKinds('prosa(Conta.mapear)', 'mapear')).toEqual(['unresolved']);
  });
  it('alvo de atribuição de membro resolve para o programa', () => {
    expect(memberKinds('uai o é {}\no.campo é 1', 'campo')).toEqual(['program']);
  });
  it('membro declarado pelo aluno resolve para o programa; o da biblioteca com propriedade reservada, para a biblioteca', () => {
    expect(memberKinds('uai o é { campo: 1 }\nprosa(o.campo)', 'campo')).toEqual(['program']);
    expect(memberKinds('uai o é { o_tanto: 1 }\nprosa(o.o_tanto)', 'o_tanto')).toEqual(['library']);
  });
  it('cadeia com primeiro elo válido continua sendo checada', () => {
    expect(analyzeSource('uai o é { b: { c: 1 } }\nprosa(o.b.zzzzzzzz)').codes).toEqual(['GS0305']);
    expect(analyzeSource('uai o é { b: { c: 1 } }\nprosa(o[0].zzzzzzzz)').codes).toEqual(['GS0305']);
  });
  it('atribuição a membro calculado não vira declaração', () => {
    expect(analyzeSource('uai i é 0\nuai o é {}\no[i] é 1\no[0] é 2').codes).toEqual([]);
  });
});
