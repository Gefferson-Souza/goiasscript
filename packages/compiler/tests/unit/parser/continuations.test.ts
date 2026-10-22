import { describe, expect, it } from 'vitest';
import { codes, parseText } from '../../support/parse.ts';
import { toSexp } from '../../support/sexp.ts';

describe('parser: continuação por palavra (§4.6, regra 4)', () => {
  it('continua se_ocê_quiser com se_num_for e se_não, na linha do "}" ou na seguinte, com comentário e linha em branco', () => {
    const text = 'se_ocê_quiser (a) { } se_não { }\nse_ocê_quiser (a) { }\n\n// c\nse_num_for (b) { }\nse_não { }';
    const result = parseText(text);
    expect(codes(result)).toEqual([]);
    expect(result.program.body).toHaveLength(2);
    expect(toSexp(result.program.body[1] ?? result.program)).toContain('IfStatement');
  });
  it('continua tenta_aí com se_der_ruim e por_fim em linhas separadas, com e sem parâmetro', () => {
    expect(codes(parseText('tenta_aí { }\nse_der_ruim (erro) { }\npor_fim { }'))).toEqual([]);
    expect(codes(parseText('tenta_aí { } se_der_ruim { }'))).toEqual([]);
    expect(codes(parseText('tenta_aí { }\npor_fim { }'))).toEqual([]);
  });
  it('exige se_der_ruim ou por_fim depois de tenta_aí (GS0202)', () => {
    expect(codes(parseText('tenta_aí { }'))).toEqual(['GS0202']);
  });
  it('qualquer outra palavra depois do "}" deixa a quebra terminar a instrução', () => {
    const result = parseText('se_ocê_quiser (a) { }\nprosa(1)');
    expect(result.program.body).toHaveLength(2);
    expect(codes(result)).toEqual([]);
  });
  it.each(['se_não { }', 'se_num_for (a) { }', 'se_der_ruim (e) { }', 'por_fim { }'])('%s solto é GS0205', (text) => {
    expect(codes(parseText(text))).toEqual(['GS0205']);
  });
  it('no alvo repl a palavra de continuação em linha nova dá GS0205 (§6.2)', () => {
    expect(codes(parseText('se_ocê_quiser (a) { }\nse_não { }', 'repl'))).toEqual(['GS0205']);
    expect(codes(parseText('se_ocê_quiser (a) { } se_não { }', 'repl'))).toEqual([]);
  });
  it('dá GS0203 quando a linha começa com operador binário, símbolo ou palavra', () => {
    expect(codes(parseText('uai a é 1\nmais 2'))).toEqual(['GS0203']);
    expect(codes(parseText('uai a é 1\ne_mais x'))).toEqual(['GS0203']);
    expect(codes(parseText('uai a é 1\n* 2'))).toEqual(['GS0203']);
    expect(codes(parseText('uai a é 1\nmenos 2'))).toEqual([]);
  });
});
