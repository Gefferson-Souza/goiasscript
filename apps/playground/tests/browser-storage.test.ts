import { describe, expect, it } from 'vitest';
import { browserStorage } from '../lib/browser-storage.ts';

describe('acesso ao localStorage', () => {
  it('devolve o storage quando existe', () => {
    const storage = { getItem: () => null, setItem: () => undefined };
    expect(browserStorage({ localStorage: storage })).toBe(storage);
  });

  it('devolve null quando não existe', () => {
    expect(browserStorage({})).toBeNull();
  });

  it('devolve null quando só ler a propriedade lança', () => {
    const blocked = {
      get localStorage(): never {
        throw new Error('SecurityError');
      },
    };
    expect(browserStorage(blocked)).toBeNull();
  });
});
