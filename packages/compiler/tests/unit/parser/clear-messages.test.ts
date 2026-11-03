import { describe, expect, it } from 'vitest';
import { compile } from '../../../src/compile.ts';
import { parseText } from '../../support/parse.ts';

const marks = (text: string): readonly string[] =>
  parseText(text).diagnostics.map((item) => `${item.code}:${item.args['variant'] ?? 'base'}@${String(item.start)}-${String(item.end)}`);

describe('parser: mensagens de sintaxe com o contexto certo', () => {
  it.each([
    ['prosa(1 mais)', 'GS0202:missingOperand@12-13'],
    ['prosa(1 menos)', 'GS0202:missingOperand@13-14'],
    ['prosa([1 vezes])', 'GS0202:missingOperand@14-15'],
  ])('avisa que faltou valor depois do operador em %j', (text, expected) => {
    expect(marks(text)).toEqual([expected]);
  });
  it('guarda o operador no argumento da variante', () => {
    expect(parseText('prosa(1 mais)').diagnostics[0]?.args).toMatchObject({ operator: 'mais', found: ')' });
  });
  it('não reclama de operador quando o valor existe', () => {
    expect(marks('prosa(1 mais 2)')).toEqual([]);
  });
  it.each(['vixe Erro("x")', 'vixe faz_um Erro("x")', 'vixe "texto"'])('dá a variante dos parênteses do vixe em %j', (text) => {
    expect(marks(text)).toEqual(['GS0202:bareThrow@0-4']);
  });
  it('mantém vixe com parênteses sem erro', () => {
    expect(marks('vixe(faz_um Erro("x"))')).toEqual([]);
  });
  it('separa método colado em número literal do erro genérico', () => {
    expect(marks('prosa(5.com_casas(2))')).toEqual(['GS0202:numberMethod@7-17']);
    expect(marks('prosa((5).com_casas(2))')).toEqual([]);
  });
  it('explica o ponto solto depois de número sem vazar escape cru', () => {
    expect(marks('prosa(5.)')).toEqual(['GS0202:strayDot@7-8']);
    expect(marks('uai x é 5.\nprosa(x)')).toEqual(['GS0202:strayDot@9-10']);
    expect(parseText('uai x é 5.\nprosa(x)').diagnostics[0]?.args['found']).toBe('.');
  });
  it('mantém o erro genérico sem variante nos demais casos', () => {
    expect(marks('uai a é 1 uai b é 2')[0]).toMatch(/^GS0202:base@/u);
  });
});

describe('compilador: texto final das variantes do erro de sintaxe', () => {
  const first = (text: string) => compile(text).diagnostics[0];
  it.each([
    ['prosa(1 mais)', 'Ô sô, faltou um valor depois de "mais".', 'Escreve o valor que falta, tipo: 1 mais 2.'],
    ['vixe Erro("x")', 'Ô sô, o "vixe" leva parênteses: vixe(faz_um Erro("deu ruim")).', undefined],
    ['prosa(5.com_casas(2))', 'Ô sô, número solto não aceita ".com_casas" colado nele.', 'Põe o número entre parênteses: (5).com_casas(2).'],
    ['prosa(5.)', 'Ô sô, esse ponto solto não vale. Em número, escreve 5 ou 5.0; no fim da linha, tira o ponto.', undefined],
  ])('%j sai com a mensagem da variante', (text, message, help) => {
    expect(first(text)?.message).toBe(message);
    expect(first(text)?.help).toBe(help);
  });
  it('o erro genérico não fala de número literal', () => {
    const diagnostic = first('uai a é 1 uai b é 2');
    expect(diagnostic?.help).not.toContain('número');
    expect(diagnostic?.message).toContain('não cabe aqui');
  });
  it('não vaza escape cru nem marcador em nenhuma variante', () => {
    const texts = ['prosa(1 mais)', 'vixe "x"', 'prosa(5.com_casas(2))', 'uai x é 5.\nprosa(x)'].flatMap((text) => compile(text).diagnostics.map((item) => `${item.message} ${item.help ?? ''}`));
    expect(texts.filter((line) => /\\u|«|\{\w+\}/u.test(line))).toEqual([]);
  });
});
