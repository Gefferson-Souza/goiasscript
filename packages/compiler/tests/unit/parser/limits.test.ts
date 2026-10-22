import { describe, expect, it } from 'vitest';
import { codes, parseText } from '../../support/parse.ts';
import { expectWithinBudget } from '../../support/timing.ts';

const HUGE = 100_000;
const MAX_MILLISECONDS = 3_000;

describe('parser: limites de profundidade (Review Focus 4)', () => {
  it.each([
    ['parênteses', '('.repeat(HUGE)],
    ['colchetes', '['.repeat(HUGE)],
    ['chaves de coisa', 'uai o é ' + '{ a: '.repeat(HUGE)],
    ['blocos', 'se_ocê_quiser (certeza) {\n'.repeat(HUGE)],
    ['cadeia à esquerda de operadores', '1' + ' mais 1'.repeat(HUGE)],
    ['cadeia de membros', 'a' + '.a'.repeat(HUGE)],
    ['cadeia de chamadas', 'f' + '()'.repeat(HUGE)],
    ['setas aninhadas', 'uai f é ' + 'x => '.repeat(HUGE) + '1'],
  ])('não lança nem estoura a pilha com %s e dá GS0522 uma vez', (_name, text) => {
    const started = performance.now();
    const result = parseText(text);
    expect(codes(result).filter((code) => code === 'GS0522')).toHaveLength(1);
    expectWithinBudget(performance.now() - started, MAX_MILLISECONDS);
  });
  it('aceita aninhamento até o limite e recusa acima dele', () => {
    expect(codes(parseText('uai x é ' + '('.repeat(150) + '1' + ')'.repeat(150)))).toEqual([]);
    expect(codes(parseText('uai x é ' + '('.repeat(250) + '1' + ')'.repeat(250)))).toContain('GS0522');
  });
  it('lê 100 mil espaços e 10 mil linhas dentro do teto', () => {
    expect(codes(parseText(' '.repeat(HUGE)))).toEqual([]);
    expect(codes(parseText('prosa(1)\n'.repeat(10_000)))).toEqual([]);
  });
});
