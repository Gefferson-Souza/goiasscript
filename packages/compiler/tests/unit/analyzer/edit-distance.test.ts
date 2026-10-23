import { describe, expect, it } from 'vitest';
import { CandidatePool, closestInPools } from '../../../src/analyzer/candidate-pool.ts';
import { editDistanceWithin } from '../../../src/analyzer/edit-distance.ts';

const LIMIT = 2;

describe('editDistanceWithin', () => {
  it.each([
    ['casa', 'casa', 0],
    ['casa', 'caza', 1],
    ['casa', 'cas', 1],
    ['casa', 'casas', 1],
    ['casa', 'cada', 1],
    ['abc', 'bca', 2],
    ['nome', 'nomes', 1],
    ['', 'ab', 2],
  ])('mede %s contra %s como %d', (a, b, expected) => {
    expect(editDistanceWithin(a, b, LIMIT)).toBe(expected);
  });

  it('devolve limite + 1 quando passa do corte', () => {
    expect(editDistanceWithin('casa', 'zzzz', LIMIT)).toBe(LIMIT + 1);
    expect(editDistanceWithin('casa', 'casaaaa', LIMIT)).toBe(LIMIT + 1);
    expect(editDistanceWithin('', 'abc', LIMIT)).toBe(LIMIT + 1);
  });
});

describe('closestInPools', () => {
  it('escolhe o mais perto e, no empate, o que veio primeiro', () => {
    const pools = [CandidatePool.of(['valor', 'valer']), CandidatePool.of(['valo'])];
    expect(closestInPools('valar', pools)).toBe('valor');
    expect(closestInPools('valo', pools)).toBe('valo');
  });

  it('não sugere nada quando tudo está longe', () => {
    expect(closestInPools('xyz', [CandidatePool.of(['valor', 'nome'])])).toBeUndefined();
  });

  it('descarta pela máscara de caracteres sem perder candidatos próximos', () => {
    const pool = CandidatePool.of(['zzzzzz', 'idade']);
    expect(closestInPools('idadee', [pool])).toBe('idade');
  });
});
