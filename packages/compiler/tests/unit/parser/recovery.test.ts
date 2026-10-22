import { describe, expect, it } from 'vitest';
import { codes, parseText } from '../../support/parse.ts';

describe('parser: recuperação', () => {
  it('reporta vários erros no mesmo arquivo e segue parseando (Review Focus 2)', () => {
    const result = parseText('uai a é 1 2\nuai b é )\nse_não { }\nuai c é 3\nprosa(c)');
    expect(codes(result)).toEqual(['GS0202', 'GS0202', 'GS0205']);
    expect(result.program.body.filter((node) => node.type === 'VariableDeclaration').length).toBeGreaterThanOrEqual(2);
    expect(result.program.body.some((node) => node.type === 'ErrorNode')).toBe(true);
  });
  it('ordena os diagnósticos por posição, inclusive os do lexer', () => {
    const result = parseText('uai a é "oi\nuai b é 08\nuai c é )');
    const starts = result.diagnostics.map((diagnostic) => diagnostic.start);
    expect(starts).toEqual([...starts].sort((left, right) => left - right));
    expect(codes(result)).toEqual(['GS0103', 'GS0101', 'GS0202']);
  });
  it('nunca lança e sempre progride, com lixo arbitrário', () => {
    for (const text of [')))', '}}}', 'uai', 'uai é', '(', '[', '{', 'faz_trem', 'a mais', '=> =>', '. . .']) {
      expect(() => parseText(text)).not.toThrow();
    }
  });
  it('liga incomplete só no alvo repl e só com GS0201 ou GS0106', () => {
    const incompletes = ['se_ocê_quiser (a) {', 'uai x é (1', 'uai l é [1,', 'uai x é 1 mais', 'uai x é 1 é', 'lista.', 'uai f é x =>', '/* aberto'];
    expect(incompletes.map((text) => parseText(text, 'repl').incomplete)).toEqual(incompletes.map(() => true));
    expect(parseText('uai x é 1 mais', 'module').incomplete).toBe(false);
    expect(parseText('uai x é "aberto', 'repl').incomplete).toBe(false);
    expect(parseText('uai x é )', 'repl').incomplete).toBe(false);
  });
  it('dá GS0201 no fim da entrada dentro de bloco, parênteses e lista', () => {
    expect(codes(parseText('se_ocê_quiser (a) {'))).toEqual(['GS0201']);
    expect(codes(parseText('prosa(1,'))).toEqual(['GS0201']);
  });
});
