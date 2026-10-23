import { COMPLETION_LABELS } from '@goiasscript/language';
import snippets from '@goiasscript/language/generated/snippets.json';
import { lessonIdOfTerm, lessonUrlOf } from '../lesson-routes.ts';
import { COMPLETION_ITEM_KIND, SNIPPET_DETAIL, SNIPPET_INSERT_RULE } from './completion-provider.constants.ts';
import type { Candidate, CompletionContext, CompletionEntry, LessonLookup, SnippetDefinition } from './completion-provider.types.ts';
import { lessonLink, untrusted } from './markdown-content.ts';

const DEFAULT_LESSONS: LessonLookup = { lessonIdOf: lessonIdOfTerm, lessonUrlOf };
const TRAILING_WORD = /[\p{L}\p{M}\p{N}_]*$/u;
const ACCENT_MARKS = /\p{M}/gu;
const SORT_SEPARATOR = '\u0000';
const SNIPPETS: readonly SnippetDefinition[] = Object.values(snippets as Readonly<Record<string, SnippetDefinition>>);

const fold = (text: string): string => text.normalize('NFD').replaceAll(ACCENT_MARKS, '').toLowerCase();

const compareText = (left: string, right: string): number => {
  if (left < right) return -1;
  return left > right ? 1 : 0;
};

export function completionContextAt(textBeforeCursor: string): CompletionContext {
  const prefix = TRAILING_WORD.exec(textBeforeCursor)?.[0] ?? '';
  const beforePrefix = textBeforeCursor.slice(0, textBeforeCursor.length - prefix.length);
  return { prefix, afterDot: beforePrefix.endsWith('.') };
}

function documentationFor(term: string, lessons: LessonLookup): Pick<CompletionEntry, 'documentation'> {
  const lessonId = lessons.lessonIdOf(term);
  const url = lessonId === undefined ? undefined : lessons.lessonUrlOf(lessonId);
  return url === undefined ? {} : { documentation: untrusted(lessonLink(url)) };
}

function labelCandidates(lessons: LessonLookup): readonly Candidate[] {
  return COMPLETION_LABELS.map((item) => ({
    member: item.member,
    entry: {
      label: item.label,
      detail: item.detail,
      kind: COMPLETION_ITEM_KIND[item.kind],
      insertText: item.label,
      sortText: `${fold(item.label)}${SORT_SEPARATOR}${item.label}`,
      ...documentationFor(item.canonical, lessons),
    },
  }));
}

function snippetCandidates(): readonly Candidate[] {
  return SNIPPETS.map((snippet) => ({
    member: false,
    entry: {
      label: snippet.prefix,
      detail: SNIPPET_DETAIL,
      kind: COMPLETION_ITEM_KIND.snippet,
      insertText: snippet.body.join('\n'),
      insertTextRules: SNIPPET_INSERT_RULE,
      sortText: `${fold(snippet.prefix)}${SORT_SEPARATOR}${SORT_SEPARATOR}${snippet.prefix}`,
    },
  }));
}

export function provideCompletions(context: CompletionContext, lessons: LessonLookup = DEFAULT_LESSONS): readonly CompletionEntry[] {
  const wanted = fold(context.prefix);
  const candidates = context.afterDot ? labelCandidates(lessons).filter((candidate) => candidate.member) : [...labelCandidates(lessons), ...snippetCandidates()].filter((candidate) => !candidate.member);
  return candidates
    .filter((candidate) => fold(candidate.entry.label).startsWith(wanted))
    .map((candidate) => candidate.entry)
    .toSorted((left, right) => compareText(left.sortText, right.sortText));
}
