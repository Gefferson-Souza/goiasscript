import type { StorageLike } from './saved-code.types.ts';

// Só ler `localStorage` já lança em modo privado ou com dados de site bloqueados.
export function browserStorage(scope: { readonly localStorage?: StorageLike } = globalThis): StorageLike | null {
  try {
    return scope.localStorage ?? null;
  } catch {
    return null;
  }
}
