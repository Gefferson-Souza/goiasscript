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

  it('acha o vizinho certo em pool grande, com o mesmo desempate da varredura', () => {
    const names = Array.from({ length: 300 }, (_, index) => `item${String(index)}`);
    const pool = CandidatePool.of([...names, 'valor', 'valer']);
    expect(closestInPools('valar', [pool])).toBe('valor');
    expect(closestInPools('itemx42', [pool])).toBe('item42');
    expect(closestInPools('zzzzzzzz', [pool])).toBeUndefined();
  });

  it('o índice de remoções concorda com a força bruta em nomes sorteados', () => {
    let seed = 7;
    const next = (): number => {
      seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648;
      return seed;
    };
    const word = (): string => Array.from({ length: 3 + (next() % 6) }, () => 'abc'[next() % 3]).join('');
    const names = Array.from({ length: 400 }, word);
    const pool = CandidatePool.of(names);
    for (let round = 0; round < 300; round += 1) {
      const query = word();
      const brute = names.reduce<{ name: string; distance: number } | undefined>((found, candidate) => {
        const distance = editDistanceWithin(query, candidate, 2);
        return distance <= 2 && (found === undefined || distance < found.distance) ? { name: candidate, distance } : found;
      }, undefined);
      expect(closestInPools(query, [pool])).toBe(brute?.name);
    }
  });
});

describe('CandidatePool com índice já montado', () => {
  it('encontra nome acrescentado depois de o índice ser usado', () => {
    const names = Array.from({ length: 100 }, (_, index) => `item${String(index)}`);
    const pool = CandidatePool.of(names);
    expect(closestInPools('novoo', [pool])).toBeUndefined();
    pool.add('novo');
    expect(closestInPools('novoo', [pool])).toBe('novo');
  });
});
