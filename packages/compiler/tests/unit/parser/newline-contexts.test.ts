import { describe, expect, it } from 'vitest';
import { parseText } from '../../support/parse.ts';
import { spans } from '../../support/parser-spans.ts';

describe('parser: quebras de linha por contexto', () => {
  it('lê na linha seguinte o corpo sem chaves de uma condicional no topo do programa', () => {
    const result = parseText('se_ocê_quiser (a)\n  prosa(1)\nprosa(2)');
    expect(spans(result)).toEqual(['GS0207@20-25']);
    expect(result.program.body).toHaveLength(2);
    expect(result.program.body[0]).toMatchObject({ type: 'IfStatement', consequent: { body: [{ type: 'ExpressionStatement' }] } });
  });
  it('lê o corpo sem chaves da linha seguinte dentro de uma função', () => {
    const result = parseText('faz_trem f() { se_ocê_quiser (a)\n  prosa(1)\n}');
    expect(spans(result)).toEqual(['GS0207@35-40']);
  });
  it('lê a regex que começa na linha seguinte dentro de parênteses', () => {
    expect(spans(parseText('prosa(\n/a/)'))).toEqual(['GS0502@7-10']);
    expect(spans(parseText('prosa(x,\n/a/)'))).toEqual(['GS0502@9-12']);
    expect(spans(parseText('prosa(1,\n/a/,\n2)'))).toEqual(['GS0502@9-12']);
  });
  it('lê a regex que começa na linha seguinte fora de agrupamento', () => {
    expect(spans(parseText('uai a é 1 mais\n/b/'))).toEqual(['GS0502@15-18']);
  });
  it.each([
    ['nome sozinho', 'prosa(\n x\n =>\n 1)', 'GS0204@11-13'],
    ['nome com espaço antes da quebra', 'prosa(\n x \n => 1)', 'GS0204@12-14'],
    ['parâmetros entre parênteses', 'prosa(\n(\n a\n)\n => 1)', 'GS0204@15-17'],
    ['valor de propriedade', 'uai o é { a:\n x\n => 1 }', 'GS0204@17-19'],
  ])('enxerga a seta através das quebras de linha dentro de agrupamento: %s', (_name, text, expected) => {
    expect(spans(parseText(text))).toEqual([expected]);
  });
  it('enxerga o parêntese do método abreviado depois da quebra dentro da coisa', () => {
    expect(spans(parseText('uai o é {\n m\n () { }\n}'))).toEqual(['GS0520@11-20']);
  });
});

describe('parser: palavras de versões anteriores com corpo', () => {
  it('pula o bloco entre chaves e continua na instrução seguinte', () => {
    expect(spans(parseText('um_tanto_de x { y }\nprosa(2)'))).toHaveLength(1);
  });
  it('não pula nada além do próprio bloco quando ele existe', () => {
    const result = parseText('presta_serviço {a} prosa(1)');
    expect(spans(result)).toEqual([
      'GS0306@0-14{"word":"presta_serviço","replacement":"faz_trem"}',
      'GS0202@19-24{"found":"prosa"}',
    ]);
  });
  it('pula só até o fim da instrução quando não há bloco', () => {
    const result = parseText('presta_serviço x\nprosa(1)');
    expect(result.program.body.map((statement) => statement.type)).toEqual(['ErrorNode', 'ExpressionStatement']);
  });
});
