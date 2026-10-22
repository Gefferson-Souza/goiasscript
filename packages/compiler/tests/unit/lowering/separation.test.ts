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
});
