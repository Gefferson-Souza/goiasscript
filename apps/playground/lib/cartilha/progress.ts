import type { StorageLike } from '../saved-code.types.ts';
import { LESSON_ID_FORMAT } from './lesson.constants.ts';
import { EMPTY_PROGRESS, PROGRESS_STORAGE_KEY } from './progress.constants.ts';
import type { LessonProgress } from './progress.types.ts';

const isLessonId = (value: unknown): value is string => typeof value === 'string' && LESSON_ID_FORMAT.test(value);

function parseIds(raw: string | null): readonly string[] {
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? [...new Set(parsed.filter(isLessonId))] : [];
  } catch {
    return [];
  }
}

// Modo privado e cota cheia lançam: a lição precisa funcionar igual sem armazenamento.
export function readProgress(storage: StorageLike | null): LessonProgress {
  if (storage === null) return EMPTY_PROGRESS;
  try {
    return { completed: parseIds(storage.getItem(PROGRESS_STORAGE_KEY)) };
  } catch {
    return EMPTY_PROGRESS;
  }
}

export function markCompleted(storage: StorageLike | null, lessonId: string): LessonProgress {
  const current = readProgress(storage).completed;
  if (!isLessonId(lessonId) || current.includes(lessonId)) return { completed: current };
  const next = [...current, lessonId];
  try {
    storage?.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    return { completed: next };
  }
  return { completed: next };
}
