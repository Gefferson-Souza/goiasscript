import { GLOSSARY_ANCHOR_PREFIX, KEYWORD_CATEGORY_LABELS } from './glossary.constants.ts';
import type { GlossaryEntry, GlossarySource } from './glossary.types.ts';
import { lessonUrlOf } from './lesson-routes.ts';

export const termAnchor = (term: string): string => `${GLOSSARY_ANCHOR_PREFIX}${term.normalize('NFC')}`;

export function buildGlossaryEntries(source: GlossarySource, lessonIdOf: (term: string) => string | undefined): readonly GlossaryEntry[] {
  const withLesson = (term: string): { readonly lessonUrl?: string } => {
    const lessonId = lessonIdOf(term.normalize('NFC'));
    const lessonUrl = lessonId === undefined ? undefined : lessonUrlOf(lessonId);
    return lessonUrl === undefined ? {} : { lessonUrl };
  };
  const keywords = source.keywords.map((entry): GlossaryEntry => ({
    term: entry.term, js: entry.js, detail: KEYWORD_CATEGORY_LABELS[entry.category] ?? '', group: 'keyword', anchor: termAnchor(entry.term), ...withLesson(entry.term),
  }));
  const library = source.library.map((entry): GlossaryEntry => ({
    term: entry.term, js: entry.js, detail: '', group: 'library', anchor: termAnchor(entry.term), ...withLesson(entry.term),
  }));
  const seen = new Set(keywords.map((entry) => entry.term));
  return [...keywords, ...library.filter((entry) => !seen.has(entry.term))];
}
