import { LESSON_INDEX_EXTENSION_HEADER, LESSON_INDEX_PLAYGROUND_HEADER } from './lesson-index.constants.ts';
import type { LessonIndex } from './lesson-index.types.ts';
import type { Lesson } from './lesson.types.ts';

const quote = (text: string): string => `'${text.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
const compareText = (left: string, right: string): number => {
  if (left < right) return -1;
  return left > right ? 1 : 0;
};

export function buildLessonIndex(lessons: readonly Lesson[]): LessonIndex {
  const ordered = lessons.toSorted((a, b) => a.order - b.order);
  const pairs = ordered.flatMap((lesson) => lesson.terms.map((term): readonly [string, string] => [term.normalize('NFC'), lesson.id]));
  return {
    lessonIds: ordered.map((lesson) => lesson.id),
    terms: Object.fromEntries(pairs.toSorted(([left], [right]) => compareText(left, right))),
  };
}

function renderTerms(index: LessonIndex): string {
  const lines = Object.entries(index.terms).map(([term, lessonId]) => `  ${quote(term)}: ${quote(lessonId)},`);
  return ['export const LESSON_TERMS: Readonly<Record<string, string>> = {', ...lines, '};'].join('\n');
}

export function renderPlaygroundIndex(index: LessonIndex): string {
  const ids = index.lessonIds.map((id) => `  ${quote(id)},`).join('\n');
  return `${LESSON_INDEX_PLAYGROUND_HEADER}\nexport const AVAILABLE_LESSON_IDS: readonly string[] = [\n${ids}\n];\n\n${renderTerms(index)}\n`;
}

export function renderExtensionTerms(index: LessonIndex): string {
  return `${LESSON_INDEX_EXTENSION_HEADER}\n${renderTerms(index)}\n`;
}
