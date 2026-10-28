import { describe, expect, it } from 'vitest';
import { needsSpace } from '../../../src/lowering/token-separation.ts';
import { emit } from '../../support/lower.ts';

describe('separação de tokens', () => {
  it.each([
    ['uai x é 5\nuai y é x menos-1', 'const x = 5;\nconst y = x - -1;'],
    ['uai x é 5\nuai y é x menos -1', 'const x = 5;\nconst y = x - -1;'],
    ['uai x é 5\nuai y é x vezes-1', 'const x = 5;\nconst y = x *-1;'],
    ['uai x é 5\nuai y é x menos(1)', 'const x = 5;\nconst y = x -(1);'],
  ])('%s', (src, js) => {
    expect(emit(src).code).toBe(js);
  });
  it('só pede espaço quando os símbolos formariam outro token', () => {
    expect(needsSpace('x', '-', '-')).toBe(true);
    expect(needsSpace('x', '/', '*')).toBe(true);
    expect(needsSpace('/', '/', 'x')).toBe(true);
    expect(needsSpace('<', '=', 'x')).toBe(true);
    expect(needsSpace('x', '+', '1')).toBe(false);
    expect(needsSpace(' ', '-', ' ')).toBe(false);
  });
  it('símbolo no fim do arquivo não separa operador binário do operando', () => {
    expect(emit('uai y é 2 vezes 3 //').code).toBe('const y = 2 * 3; //');
  });
  it('símbolo no começo ou no fim do arquivo não separa operador unário', () => {
    expect(emit('-1\nuai y é menos 1').code).toBe('-1;\nconst y = -1;');
    expect(emit('uai y é menos 1 // -').code).toBe('const y = -1; // -');
  });
  it('operador unário seguido de sinal ganha espaço', () => {
    expect(emit('uai y é menos -1').code).toBe('const y = - -1;');
  });
  it('declarador colado a um sinal não ganha espaço desnecessário', () => {
    expect(emit('uai a é-1').code).toBe('const a =-1;');
  });
});
