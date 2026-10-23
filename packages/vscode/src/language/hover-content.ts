import { lookupKeyword, lookupStdlibGlobal, lookupStdlibMember } from '@goiasscript/language';
import { BACKTICK, KEYWORD_CATEGORY_LABELS, MARKDOWN_SPECIAL, RECEIVER_CATEGORY_LABELS } from './hover-content.constants.ts';
import type { HoverText } from './hover-content.types.ts';
import { LESSON_LINK_LABEL } from './lesson-link.constants.ts';
import { DEFAULT_LESSONS, lessonUrlFor } from './lesson-link.ts';
import type { LessonLookup } from './lesson-link.types.ts';

interface WordFacts {
  readonly js: string;
  readonly category: string;
}

const escapeMarkdown = (text: string): string => text.replaceAll(MARKDOWN_SPECIAL, '\\$&');
const inlineCode = (code: string): string => `\`${code.replaceAll(BACKTICK, '')}\``;

const markdownUrl = (url: string): string => encodeURI(url).replaceAll('(', '%28').replaceAll(')', '%29');

function factsOf(word: string): WordFacts | undefined {
  const keyword = lookupKeyword(word);
  if (keyword !== undefined) return { js: keyword.js, category: KEYWORD_CATEGORY_LABELS[keyword.category] };
  const entry = lookupStdlibGlobal(word) ?? lookupStdlibMember(word)[0];
  return entry === undefined ? undefined : { js: entry.js, category: RECEIVER_CATEGORY_LABELS[entry.receiver] };
}

export function hoverFor(rawWord: string, lessonBaseUrl: string | null, lessons: LessonLookup = DEFAULT_LESSONS): HoverText | null {
  const word = rawWord.normalize('NFC');
  const facts = factsOf(word);
  if (facts === undefined) return null;
  const url = lessonUrlFor(word, lessonBaseUrl, lessons);
  const lines = [
    `**${escapeMarkdown(word)}** em JavaScript é ${inlineCode(facts.js)}`,
    `Categoria: ${facts.category}`,
    ...(url === undefined ? [] : [`[${LESSON_LINK_LABEL}](${markdownUrl(url)})`]),
  ];
  return { markdown: lines.join('\n\n'), trusted: false };
}
