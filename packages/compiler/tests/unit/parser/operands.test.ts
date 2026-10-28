import { describe, expect, it } from 'vitest';
import type { Expression, Statement } from '../../../src/ast/ast.types.ts';
import { parseText } from '../../support/parse.ts';
import { spans } from '../../support/parser-spans.ts';

const initOf = (text: string): Expression => {
  const statement: Statement | undefined = parseText(text).program.body[0];
  const init = statement?.type === 'VariableDeclaration' ? statement.declarations[0]?.init : undefined;
  if (init === null || init === undefined) throw new Error('sem inicializador');
  return init;
};

const propertiesOf = (text: string): readonly unknown[] => {
  const init = initOf(text);
  if (init.type !== 'ObjectExpression') throw new Error('esperava uma coisa');
  return init.properties;
};

describe('parser: operandos', () => {
  it('guarda no nó de erro o código que o lexer deu ao token inválido', () => {
    const result = parseText('uai f é @');
    expect(spans(result)).toEqual(['GS0107@8-9{"character":"@"}']);
    expect(initOf('uai f é @')).toMatchObject({ type: 'ErrorNode', code: 'GS0107' });
  });
  it('lê faz_um sem parênteses como chamada sem argumentos que termina no nome', () => {
    const text = 'uai f é faz_um Pequi';
    expect(initOf(text)).toMatchObject({ type: 'NewExpression', arguments: [], end: text.length });
  });
  it('marca como assíncrona a seta que vem depois de vai_na_frente', () => {
    const arrow = initOf('uai f é vai_na_frente x => x');
    expect(arrow).toMatchObject({ type: 'ArrowFunctionExpression', async: true, start: 8 });
  });
  it('reporta a quebra de linha depois de vai_na_frente e ainda lê a seta', () => {
    const text = 'uai f é vai_na_frente\n x => x';
    expect(spans(parseText(text))).toEqual(['GS0202@21-22{"found":"fim da linha"}']);
    expect(initOf(text)).toMatchObject({ type: 'ArrowFunctionExpression', async: true });
  });
  it('reporta o que não é seta depois de vai_na_frente e devolve o próprio operando', () => {
    const text = 'uai f é vai_na_frente 1';
    expect(spans(parseText(text))).toEqual(['GS0202@22-23{"found":"1"}']);
    expect(initOf(text)).toMatchObject({ type: 'Literal', raw: '1' });
  });
});

describe('parser: função e vixe usados como valor', () => {
  it('reporta GS0518 e pula nome, parâmetros e corpo da função anônima', () => {
    expect(spans(parseText('uai f é faz_trem soma(a) { }'))).toEqual(['GS0518@8-16']);
    expect(spans(parseText('uai f é faz_trem (a) { }'))).toEqual(['GS0518@8-16']);
    expect(spans(parseText('uai f é vai_na_frente_faz_trem () { }'))).toEqual(['GS0518@8-30']);
  });
  it('pula o nome da função anônima mesmo com quebras de linha dentro dos parênteses', () => {
    expect(spans(parseText('prosa(faz_trem\n soma\n (a) { })'))).toEqual(['GS0518@6-14']);
    expect(spans(parseText('prosa(faz_trem soma\n(a) { })'))).toEqual(['GS0518@6-14']);
  });
  it('não toma como nome da função o que não vem seguido de parênteses', () => {
    expect(spans(parseText('uai f é faz_trem soma { }'))[1]).toBe('GS0202@17-21{"found":"soma"}');
  });
  it('reporta GS0206 cobrindo os argumentos de vixe usado como valor', () => {
    expect(spans(parseText('uai a é vixe("x")'))).toEqual(['GS0206@8-17']);
    expect(spans(parseText('uai a é vixe'))).toEqual(['GS0206@8-12']);
    expect(spans(parseText('uai a é vixe "x"'))).toEqual(['GS0206@8-12', 'GS0202@13-16{"found":"\\"x\\""}']);
  });
});

describe('parser: nomes reservados e palavras estranhas', () => {
  it('guarda a keyword reservada no uso de um nome já declarado com ela', () => {
    const statement = parseText('uai mais é 1\nprosa(mais)').program.body[1];
    const call = statement?.type === 'ExpressionStatement' ? statement.expression : undefined;
    const argument = call?.type === 'CallExpression' ? call.arguments[0] : undefined;
    expect(argument).toMatchObject({ type: 'Identifier', name: 'mais', reservedKeyword: { js: '+' } });
  });
  it('lê # sem nome sem consumir o fecha-parênteses', () => {
    expect(spans(parseText('prosa(#)'))).toEqual(['GS0510@6-7']);
    expect(spans(parseText('prosa(#x)'))).toEqual(['GS0510@6-8']);
  });
  it.each([
    ['switch', 'GS0505'],
    ['debugger', 'GS0500'],
  ])('reporta %s no lugar de um valor e consome só a palavra', (word, code) => {
    const text = `prosa(${word})`;
    expect(spans(parseText(text))).toEqual([`${code}@6-${String(6 + word.length)}{"name":"${word}"}`]);
    const statement = parseText(text).program.body[0];
    const call = statement?.type === 'ExpressionStatement' ? statement.expression : undefined;
    expect(call).toMatchObject({ type: 'CallExpression', arguments: [{ type: 'ErrorNode', code: 'GS0500', start: 6, end: 6 + word.length }] });
  });
  it('reporta a palavra de outra linguagem, consome só ela e segue com o operando', () => {
    expect(spans(parseText('uai a é typeof x'))).toEqual(['GS0512@8-14{"name":"typeof"}']);
    expect(spans(parseText('uai a é delete'))).toEqual(['GS0513@8-14{"name":"delete"}', 'GS0201@14-14']);
    expect(initOf('uai a é typeof x')).toMatchObject({ type: 'Identifier', name: 'x' });
  });
});

describe('parser: propriedades de coisa', () => {
  it('lê a chave de texto e de número, e rejeita outro token como chave', () => {
    expect(spans(parseText('uai o é { "a": 1, 2: 3 }'))).toEqual([]);
    expect(spans(parseText('uai o é { + : 1 }'))).toEqual(['GS0202@10-11{"found":"+"}']);
  });
  it('devolve propriedade com chave vazia para chave calculada', () => {
    expect(spans(parseText('uai o é { [a]: 1 }'))).toEqual(['GS0521@10-13']);
    expect(propertiesOf('uai o é { [a]: 1 }')).toMatchObject([
      { type: 'Property', key: { type: 'Identifier', name: '', start: 10, end: 10 }, value: { type: 'Literal' }, start: 10 },
    ]);
  });
  it('devolve propriedade com chave vazia para espalhamento', () => {
    expect(spans(parseText('uai o é { ...a }'))).toEqual(['GS0504@10-13']);
    expect(propertiesOf('uai o é { ...a }')).toMatchObject([
      { type: 'Property', key: { type: 'Identifier', name: '', start: 10, end: 10 }, value: { name: 'a' }, start: 10, end: 14 },
    ]);
  });
  it('devolve propriedade com valor de erro para método abreviado', () => {
    expect(spans(parseText('uai o é { m() { } }'))).toEqual(['GS0520@10-17']);
    expect(propertiesOf('uai o é { m() { } }')).toMatchObject([
      { type: 'Property', key: { name: 'm' }, value: { type: 'ErrorNode', code: 'GS0520' }, start: 10, end: 17 },
    ]);
  });
  it('devolve a propriedade abreviada com a mesma chave e valor', () => {
    expect(spans(parseText('uai o é { a, b: 1 }'))).toEqual(['GS0519@10-11']);
    expect(propertiesOf('uai o é { a, b: 1 }')).toMatchObject([
      { type: 'Property', key: { name: 'a' }, value: { name: 'a' }, start: 10, end: 11 },
      { type: 'Property', key: { name: 'b' }, value: { raw: '1' } },
    ]);
  });
});

describe('parser: fronteiras ao recuperar de um token inesperado', () => {
  it.each([
    ['fecha-parênteses', 'prosa(1 + )', 'GS0202@10-11{"found":")"}'],
    ['fecha-colchetes dentro de lista', 'prosa([1 + ])', 'GS0202@11-12{"found":"]"}'],
    ['fecha-parênteses depois de quebra', 'prosa(1 +\n)', 'GS0202@10-11{"found":")"}'],
    ['ponto e vírgula', 'prosa(1 + ;', 'GS0202@10-11{"found":";"}'],
  ])('deixa o %s para quem abriu o grupo: %s', (_name, text, expected) => {
    expect(spans(parseText(text))).toEqual([expected]);
  });
  it('consome o fecha-parênteses solto fora de agrupamento e segue lendo depois dele', () => {
    expect(spans(parseText('x é ) 1'))).toEqual(['GS0202@4-5{"found":")"}', 'GS0202@6-7{"found":"1"}']);
  });
  it('não avança além do fim do arquivo ao recuperar de um operando que falta', () => {
    const statement = parseText('x é   ').program.body[0];
    expect(statement).toMatchObject({ type: 'ExpressionStatement', start: 0, end: 3 });
  });
  it('deixa a palavra que começa uma instrução para a instrução seguinte', () => {
    const result = parseText('uai a é se_ocê_quiser (b) { }');
    expect(spans(result)).toEqual(['GS0202@8-21{"found":"se_ocê_quiser"}']);
    expect(result.program.body.map((statement) => statement.type)).toEqual(['VariableDeclaration', 'IfStatement']);
  });
  it('deixa a chave de fechamento como instrução própria', () => {
    const result = parseText('prosa(1 + }');
    expect(spans(result)).toEqual(['GS0202@10-11{"found":"}"}']);
    expect(result.program.body.map((statement) => statement.type)).toEqual(['ExpressionStatement', 'ExpressionStatement']);
  });
  it.each([
    ['fecha-parênteses', 'x é )'],
    ['fecha-colchetes', 'x é ]'],
  ])('consome o %s solto fora de agrupamento', (_name, text) => {
    expect(spans(parseText(text))).toEqual([expect.stringMatching(/^GS0202@4-5/u)]);
  });
  it.each([')', ']', '}', ';'])('consome o texto "%s" no lugar do : e não o toma por fechamento', (closer) => {
    const text = `prosa({ a "${closer}" })`;
    expect(spans(parseText(text))).toEqual([`GS0202@10-13{"found":"\\"${closer}\\""}`, 'GS0202@14-15{"found":"}"}']);
  });
});
