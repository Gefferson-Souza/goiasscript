import { describe, expect, it } from 'vitest';
import { editDistanceWithin } from '../../../src/analyzer/edit-distance.ts';

const ALPHABET = ['a', 'b', 'c'];
const MAX_LENGTH = 4;
const MAX_LIMIT = 3;

function levenshtein(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, column) => column);
  for (let row = 1; row <= a.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= b.length; column += 1) {
      const cost = a[row - 1] === b[column - 1] ? 0 : 1;
      current.push(Math.min((previous[column] ?? 0) + 1, (current[column - 1] ?? 0) + 1, (previous[column - 1] ?? 0) + cost));
    }
    previous = current;
  }
  return previous[b.length] ?? 0;
}

function allStrings(maxLength: number): readonly string[] {
  let current: readonly string[] = [''];
  const all: string[] = [''];
  for (let length = 1; length <= maxLength; length += 1) {
    current = current.flatMap((prefix) => ALPHABET.map((letter) => prefix + letter));
    all.push(...current);
  }
  return all;
}

describe('editDistanceWithin contra a distância de Levenshtein completa', () => {
  it('é exata até o limite e limite + 1 acima dele, para todas as palavras curtas', () => {
    const words = allStrings(MAX_LENGTH);
    const mismatches: string[] = [];
    for (let limit = 0; limit <= MAX_LIMIT; limit += 1) {
      for (const a of words) {
        for (const b of words) {
          if (editDistanceWithin(a, b, limit) !== Math.min(levenshtein(a, b), limit + 1)) mismatches.push(`${a}|${b}|${String(limit)}`);
        }
      }
    }
    expect(mismatches).toEqual([]);
  });

  it('conta uma letra a mais quando o prefixo repetido esgota a palavra menor', () => {
    expect(editDistanceWithin('pp', 'ppp', 2)).toBe(1);
    expect(editDistanceWithin('ppp', 'pp', 2)).toBe(1);
    expect(editDistanceWithin('xpp', 'pp', 2)).toBe(1);
    expect(editDistanceWithin('pp', 'xpp', 2)).toBe(1);
  });

  it('troca letras do meio sem confundir com as vizinhas', () => {
    expect(editDistanceWithin('abcd', 'xbcy', 2)).toBe(2);
    expect(editDistanceWithin('abcdef', 'abxdef', 2)).toBe(1);
  });
});
