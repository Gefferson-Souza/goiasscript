import { describe, expect, it } from 'vitest';
import type { Statement } from '../../../src/ast/ast.types.ts';
import { parseText } from '../../support/parse.ts';
import { spans } from '../../support/parser-spans.ts';

const firstOf = (text: string): Statement => {
  const statement = parseText(text).program.body[0];
  if (statement === undefined) throw new Error('programa vazio');
  return statement;
};

describe('parser: condicionais', () => {
  it('reporta GS0202 quando a condição não abre parênteses e segue lendo o corpo', () => {
    const result = parseText('se_ocê_quiser x { }');
    expect(spans(result)).toEqual([
      'GS0202@14-15{"found":"x"}',
      'GS0207@14-15',
      'GS0202@16-17{"found":"{"}',
      'GS0202@18-19{"found":"}"}',
    ]);
  });
  it('lê se_num_for como condicional encadeada', () => {
    const statement = firstOf('se_ocê_quiser (a) { } se_num_for (b) { }');
    expect(statement).toMatchObject({ type: 'IfStatement', alternate: { type: 'IfStatement' } });
  });
  it('lê se_não como bloco final, com ou sem chaves', () => {
    expect(firstOf('se_ocê_quiser (a) { } se_não { }')).toMatchObject({ alternate: { type: 'BlockStatement', body: [] } });
    const blockless = parseText('se_ocê_quiser (a) { } se_não prosa(1)');
    expect(spans(blockless)).toEqual(['GS0207@29-34']);
    expect(blockless.program.body[0]).toMatchObject({ alternate: { type: 'BlockStatement', body: [{ type: 'ExpressionStatement' }] } });
  });
  it('lê se_não seguido do if de JavaScript como condicional encadeada', () => {
    const result = parseText('se_ocê_quiser (a) { } se_não if (b) { }');
    expect(spans(result)).toEqual(['GS0401@29-31{"name":"if","suggestion":"se_ocê_quiser"}']);
    expect(result.program.body[0]).toMatchObject({ alternate: { type: 'IfStatement' } });
  });
  it('lê um texto "if" depois de se_não como corpo sem chaves, não como condicional encadeada', () => {
    const result = parseText('se_ocê_quiser (a) { } se_não "if"');
    expect(spans(result)).toEqual(['GS0207@29-33']);
    expect(result.program.body[0]).toMatchObject({ alternate: { type: 'BlockStatement' } });
  });
});

describe('parser: laços e tenta_aí', () => {
  it('lê o vai_indo clássico com declaração e atualização', () => {
    expect(firstOf('vai_indo (uai i é 0; i menor_que 3; i é i mais 1) { }')).toMatchObject({
      type: 'ForStatement',
      init: { type: 'VariableDeclaration' },
      test: { type: 'BinaryExpression' },
      update: { type: 'AssignmentExpression' },
    });
  });
  it('não lê como vai_indo de coleção o que não começa com declaração', () => {
    const result = parseText('vai_indo (x de lista) { }');
    expect(spans(result)).toEqual(['GS0202@12-14{"found":"de"}', 'GS0202@15-20{"found":"lista"}']);
    expect(result.program.body[0]?.type).toBe('ForStatement');
  });
  it('aceita vai_indo clássico sem a parte de atualização', () => {
    const result = parseText('vai_indo (uai i é 0; i menor_que 3; ) { }');
    expect(spans(result)).toEqual([]);
    expect(result.program.body[0]).toMatchObject({ type: 'ForStatement', update: null });
  });
  it('reporta GS0202 sem parênteses e devolve as partes todas nulas', () => {
    const result = parseText('vai_indo { }');
    expect(spans(result)).toEqual(['GS0202@9-10{"found":"{"}']);
    expect(result.program.body[0]).toMatchObject({ type: 'ForStatement', init: null, test: null, update: null });
  });
  it('lê tenta_aí só com por_fim, sem tratador', () => {
    expect(firstOf('tenta_aí { } por_fim { }')).toMatchObject({ type: 'TryStatement', handler: null, finalizer: { type: 'BlockStatement' } });
  });
  it('reporta o que veio no lugar quando o tenta_aí não tem tratador nem por_fim', () => {
    expect(spans(parseText('tenta_aí { }\nprosa(1)'))).toEqual(['GS0202@12-13{"found":"fim da linha"}']);
    expect(spans(parseText('tenta_aí { } x'))).toEqual(['GS0202@13-14{"found":"x"}']);
  });
});
