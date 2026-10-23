import { SAVED_CODE_KEY, SAVED_CODE_MAX_BYTES } from './saved-code.constants.ts';
import type { StorageLike } from './saved-code.types.ts';

const encoder = new TextEncoder();
const fitsLimit = (source: string): boolean => encoder.encode(source).length <= SAVED_CODE_MAX_BYTES;

// Modo privado e cota cheia lançam: a página precisa abrir igual sem o código salvo.
export function readSavedCode(storage: StorageLike | null): string | null {
  if (storage === null) return null;
  try {
    const value: unknown = storage.getItem(SAVED_CODE_KEY);
    return typeof value === 'string' && fitsLimit(value) ? value : null;
  } catch {
    return null;
  }
}

export function writeSavedCode(storage: StorageLike | null, source: string): boolean {
  if (storage === null || !fitsLimit(source)) return false;
  try {
    storage.setItem(SAVED_CODE_KEY, source);
    return true;
  } catch {
    return false;
  }
}
