import { describe, expect, it } from 'vitest';
import { readSavedCode, writeSavedCode } from '../lib/saved-code.ts';
import type { StorageLike } from '../lib/saved-code.types.ts';

function memoryStorage(): StorageLike & { readonly data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

const throwingStorage: StorageLike = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
};

describe('código salvo no navegador', () => {
  it('devolve null e false, sem lançar, quando o storage quebra (modo privado)', () => {
    expect(readSavedCode(throwingStorage)).toBeNull();
    expect(writeSavedCode(throwingStorage, 'prosa("oi")')).toBe(false);
  });

  it('devolve null quando não há storage nenhum', () => {
    expect(readSavedCode(null)).toBeNull();
    expect(writeSavedCode(null, 'x')).toBe(false);
  });

  it('devolve null quando não há nada salvo', () => {
    expect(readSavedCode(memoryStorage())).toBeNull();
  });

  it('ignora valor corrompido: não-string ou acima de 200 KB', () => {
    const storage = memoryStorage();
    const nonString = { getItem: () => 42 as unknown as string, setItem: () => undefined } satisfies StorageLike;
    expect(readSavedCode(nonString)).toBeNull();
    storage.setItem('goiasscript:codigo', 'a'.repeat(200 * 1024 + 1));
    expect(readSavedCode(storage)).toBeNull();
  });

  it('recusa gravar texto acima de 200 KB', () => {
    const storage = memoryStorage();
    expect(writeSavedCode(storage, 'a'.repeat(200 * 1024 + 1))).toBe(false);
    expect(storage.data.size).toBe(0);
  });

  it('faz ida e volta de texto com acento NFD e emoji', () => {
    const storage = memoryStorage();
    const source = 'prosa("Goiás \u{1F402} bão")';
    expect(writeSavedCode(storage, source)).toBe(true);
    expect(readSavedCode(storage)).toBe(source);
  });
});
