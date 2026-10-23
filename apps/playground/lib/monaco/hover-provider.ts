import { lookupKeyword, lookupStdlibGlobal, lookupStdlibMember } from '@goiasscript/language';
import { lessonIdOfTerm, lessonUrlOf } from '../lesson-routes.ts';
import type { LessonLookup } from './completion-provider.types.ts';
import { escapeMarkdown, inlineCode, lessonLink, untrusted } from './markdown-content.ts';
import type { MarkdownContent } from './markdown-content.types.ts';

const DEFAULT_LESSONS: LessonLookup = { lessonIdOf: lessonIdOfTerm, lessonUrlOf };

function jsEquivalentOf(word: string): string | undefined {
  return lookupKeyword(word)?.js ?? (lookupStdlibGlobal(word) ?? lookupStdlibMember(word)[0])?.js;
}

export function provideHover(rawWord: string, lessons: LessonLookup = DEFAULT_LESSONS): MarkdownContent | null {
  const word = rawWord.normalize('NFC');
  const js = jsEquivalentOf(word);
  if (js === undefined) return null;
  const lessonId = lessons.lessonIdOf(word);
  const url = lessonId === undefined ? undefined : lessons.lessonUrlOf(lessonId);
  const lines = [`**${escapeMarkdown(word)}** em JavaScript é ${inlineCode(js)}`, ...(url === undefined ? [] : [lessonLink(url)])];
  return untrusted(lines.join('\n\n'));
}
