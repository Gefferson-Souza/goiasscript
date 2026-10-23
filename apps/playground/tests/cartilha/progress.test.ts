import { describe, expect, it } from 'vitest';
import { markCompleted, readProgress } from '../../lib/cartilha/progress.ts';
import { PROGRESS_STORAGE_KEY } from '../../lib/cartilha/progress.constants.ts';
import type { StorageLike } from '../../lib/saved-code.types.ts';

function memoryStorage(initial?: string): StorageLike & { readonly data: Map<string, string> } {
  const data = new Map<string, string>(initial === undefined ? [] : [[PROGRESS_STORAGE_KEY, initial]]);
  return { data, getItem: (key) => data.get(key) ?? null, setItem: (key, value) => void data.set(key, value) };
}

const throwingStorage: StorageLike = {
  getItem: () => {
    throw new Error('bloqueado');
  },
  setItem: () => {
    throw new Error('bloqueado');
  },
};

describe('progresso da cartilha', () => {
  it('lê vazio quando o storage lança', () => {
    expect(readProgress(throwingStorage)).toEqual({ completed: [] });
  });

  it('lê vazio quando não há storage', () => {
    expect(readProgress(null)).toEqual({ completed: [] });
  });

  it('marca concluída sem duplicar', () => {
    const storage = memoryStorage();
    markCompleted(storage, 'licao-01');
    const result = markCompleted(storage, 'licao-01');
    expect(result.completed).toEqual(['licao-01']);
    expect(readProgress(storage).completed).toEqual(['licao-01']);
  });

  it('guarda em ordem de conclusão e preserva o que já existia', () => {
    const storage = memoryStorage(JSON.stringify(['licao-02']));
    expect(markCompleted(storage, 'licao-01').completed).toEqual(['licao-02', 'licao-01']);
  });

  it('ignora id fora do padrão', () => {
    const storage = memoryStorage(JSON.stringify(['licao-01', '<script>', 'licao-1', 7]));
    expect(readProgress(storage).completed).toEqual(['licao-01']);
    expect(markCompleted(storage, '../x').completed).toEqual(['licao-01']);
  });

  it('JSON torto ou tipo errado volta a vazio', () => {
    expect(readProgress(memoryStorage('{torto')).completed).toEqual([]);
    expect(readProgress(memoryStorage('{"a":1}')).completed).toEqual([]);
    expect(readProgress(memoryStorage('"licao-01"')).completed).toEqual([]);
  });

  it('sem armazenamento a conclusão vale na sessão, só não persiste', () => {
    expect(markCompleted(throwingStorage, 'licao-03').completed).toEqual(['licao-03']);
    expect(markCompleted(null, 'licao-03').completed).toEqual(['licao-03']);
  });
});
