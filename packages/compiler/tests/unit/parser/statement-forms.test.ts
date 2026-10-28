import { describe, expect, it } from 'vitest';
import type { ErrorNode, Statement } from '../../../src/ast/ast.types.ts';
import { parseText } from '../../support/parse.ts';
import { spans } from '../../support/parser-spans.ts';

const firstOf = (text: string): Statement => {
  const statement = parseText(text).program.body[0];
  if (statement === undefined) throw new Error('programa vazio');
  return statement;
};

describe('parser: vírgula decimal', () => {
  it('lê várias vírgulas decimais coladas em sequência', () => {
    expect(spans(parseText('10,50,25'))).toEqual(['GS0208@0-5{"suggestion":"10.50"}', 'GS0208@3-8{"suggestion":"50.25"}']);
  });
  it.each([
    ['espaço depois da vírgula', '10, 50'],
    ['espaço antes da vírgula', '10 ,50'],
    ['depois da vírgula vem nome', '10,x'],
    ['antes da vírgula vem nome', 'x,5'],
  ])('não trata como vírgula decimal quando %s', (_name, text) => {
    expect(spans(parseText(text))).toEqual([expect.stringMatching(/^GS0523@/u)]);
  });
});

describe('parser: fim de instrução e saltos', () => {
  it('inclui o ponto e vírgula no fim do corpo sem chaves', () => {
    const text = 'se_ocê_quiser (a) prosa(1); prosa(2)';
    expect(firstOf(text).end).toBe(text.indexOf(';') + 1);
  });
  it('distingue continua_aí de para_com_isso', () => {
    expect(firstOf('continua_aí').type).toBe('ContinueStatement');
    expect(firstOf('para_com_isso').type).toBe('BreakStatement');
  });
});

describe('parser: faz_favor sem valor', () => {
  it.each([
    ['fim do arquivo', 'faz_favor'],
    ['ponto e vírgula', 'faz_favor;'],
    ['fim da função', 'faz_trem f() { faz_favor }'],
    ['fim da linha', 'faz_favor\nprosa(1)'],
  ])('devolve argumento nulo antes de %s', (_name, text) => {
    const result = parseText(text);
    expect(spans(result)).toEqual([]);
    const statement = result.program.body[0];
    const returned = statement?.type === 'FunctionDeclaration' ? statement.body.body[0] : statement;
    expect(returned).toMatchObject({ type: 'ReturnStatement', argument: null });
  });
  it('lê como valor um texto que só se parece com terminador', () => {
    expect(firstOf('faz_favor ";"')).toMatchObject({ type: 'ReturnStatement', argument: { type: 'Literal', raw: '";"' } });
    expect(firstOf('faz_favor 1')).toMatchObject({ type: 'ReturnStatement', argument: { type: 'Literal' } });
  });
});

describe('parser: palavras de versões anteriores', () => {
  it('informa a substituição quando existe e a frase de remoção quando não existe', () => {
    expect(spans(parseText('presta_serviço x'))).toEqual(['GS0306@0-14{"word":"presta_serviço","replacement":"faz_trem"}']);
    expect(spans(parseText('um_tanto_de x'))).toEqual(['GS0306@0-11{"word":"um_tanto_de","gone":"saiu da linguagem, sem substituto na v3"}']);
  });
  it('pula o bloco da construção antiga sem reportar nada a mais', () => {
    expect(spans(parseText('um_tanto_de {a}\nprosa(1)'))).toEqual([expect.stringMatching(/^GS0306@0-11/u)]);
    expect(spans(parseText('um_tanto_de x\nprosa(1)'))).toEqual([expect.stringMatching(/^GS0306@0-11/u)]);
  });
  it('lê presta_serviço com nome e parênteses como a declaração de função', () => {
    const result = parseText('presta_serviço soma(a, b) { }');
    expect(spans(result)).toEqual(['GS0306@0-14{"word":"presta_serviço","replacement":"faz_trem"}']);
    expect(result.program.body[0]).toMatchObject({ type: 'FunctionDeclaration' });
  });
  it.each([
    ['sem parênteses', 'presta_serviço soma { }'],
    ['sem nome', 'presta_serviço { }'],
  ])('não lê como declaração quando %s', (_name, text) => {
    expect(firstOf(text).type).toBe('ErrorNode');
  });
});

describe('parser: vai_na_frente no começo da instrução', () => {
  it('reporta a quebra de linha logo depois e segue para a próxima instrução', () => {
    const result = parseText('vai_na_frente\nfoo');
    expect(spans(result)).toEqual(['GS0202@13-14{"found":"fim da linha"}']);
    expect(result.program.body.map((statement) => statement.type)).toEqual(['ErrorNode', 'ExpressionStatement']);
  });
  it.each([
    ['nome comum', 'vai_na_frente foo'],
    ['número', 'vai_na_frente 1'],
  ])('lê %s depois dele como expressão com GS0202', (_name, text) => {
    const result = parseText(text);
    expect(spans(result)).toEqual([expect.stringMatching(/^GS0202@14-/u)]);
    expect(result.program.body[0]?.type).toBe('ExpressionStatement');
  });
  it('não toma como function de JavaScript um texto "function"', () => {
    const result = parseText('vai_na_frente "function"');
    expect(spans(result)).toEqual(['GS0202@14-24{"found":"\\"function\\""}']);
    expect(result.program.body[0]?.type).toBe('ExpressionStatement');
  });
  it('lê o function de JavaScript depois dele como função assíncrona', () => {
    const result = parseText('vai_na_frente function f() { }');
    expect(spans(result)).toEqual(['GS0401@14-22{"name":"function","suggestion":"faz_trem"}']);
    expect(result.program.body[0]).toMatchObject({ type: 'FunctionDeclaration', async: true });
  });
});

describe('parser: continuação solta', () => {
  it('reporta GS0205 com a palavra e consome o bloco que vem depois', () => {
    expect(spans(parseText('se_não { prosa(1) }'))).toEqual(['GS0205@0-6{"found":"se_não"}']);
    expect(spans(parseText('se_não\n{ }'))).toEqual(['GS0205@0-6{"found":"se_não"}']);
    expect(spans(parseText('se_não (a) { }'))).toEqual(['GS0205@0-6{"found":"se_não"}']);
  });
  it('trata o bloco da linha seguinte como parte da continuação solta', () => {
    const result = parseText('se_não\n{ }\nprosa(1)');
    expect(result.program.body.map((statement) => statement.type)).toEqual(['ErrorNode', 'ExpressionStatement']);
  });
  it('não tenta ler bloco quando não há chaves depois da palavra solta', () => {
    const result = parseText('se_não prosa(1)');
    expect(spans(result)).toEqual(['GS0205@0-6{"found":"se_não"}']);
    expect(result.program.body.map((statement) => statement.type)).toEqual(['ErrorNode', 'ExpressionStatement']);
    expect((firstOf('se_não { }') as ErrorNode).end).toBe('se_não { }'.length);
  });
});
