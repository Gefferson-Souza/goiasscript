import { COMPLETION_LABELS } from '@goiasscript/language';
import snippets from '@goiasscript/language/generated/snippets.json' with { type: 'json' };
import type { CompletionItemData } from '../host/extension-host.types.ts';
import { ACCENT_MARKS, DIGIT_START, DOUBLE_DOT_SUFFIX, SORT_SEPARATOR, SPREAD_OPERATOR_SUFFIX } from './completion-items.constants.ts';
import type { CompletionContext, SnippetDefinition } from './completion-items.types.ts';
import { DEFAULT_LESSONS, lessonUrlFor } from './lesson-link.ts';
import type { LessonLookup } from './lesson-link.types.ts';
import { trailingIdentifier } from './word-at.ts';

interface Candidate {
  readonly member: boolean;
  readonly sortKey: string;
  readonly item: CompletionItemData;
}

const SNIPPETS: readonly SnippetDefinition[] = Object.values(snippets as Readonly<Record<string, SnippetDefinition>>);

const fold = (text: string): string => text.normalize('NFD').replaceAll(ACCENT_MARKS, '').toLowerCase();

const compareText = (left: string, right: string): number => {
  if (left < right) return -1;
  return left > right ? 1 : 0;
};

function labelCandidates(lessonBaseUrl: string | null, lessons: LessonLookup): readonly Candidate[] {
  return COMPLETION_LABELS.map((entry) => {
    const lessonUrl = lessonUrlFor(entry.canonical, lessonBaseUrl, lessons);
    return {
      member: entry.member,
      sortKey: `${fold(entry.label)}${SORT_SEPARATOR}${entry.label}${SORT_SEPARATOR}${entry.kind}`,
      item: { label: entry.label, detail: entry.detail, kind: entry.kind, ...(lessonUrl === undefined ? {} : { lessonUrl }) },
    };
  });
}

function snippetCandidates(): readonly Candidate[] {
  return SNIPPETS.map((snippet) => ({
    member: false,
    sortKey: `${fold(snippet.prefix)}${SORT_SEPARATOR}${SORT_SEPARATOR}${snippet.prefix}`,
    item: { label: snippet.prefix, detail: 'trecho', kind: 'snippet', insertText: snippet.body.join('\n') },
  }));
}

// Depois de ponto de número (1.) ou de ponto duplo (..) não há membro a sugerir.
function memberAccessAllowed(beforePrefix: string): boolean {
  if (beforePrefix.endsWith(DOUBLE_DOT_SUFFIX)) return false;
  const receiver = trailingIdentifier(beforePrefix.slice(0, -1));
  return !DIGIT_START.test(receiver) && beforePrefix.length > 1;
}

export function completionItemsFor(context: CompletionContext, lessons: LessonLookup = DEFAULT_LESSONS): readonly CompletionItemData[] {
  const prefix = trailingIdentifier(context.linePrefix);
  const beforePrefix = context.linePrefix.slice(0, context.linePrefix.length - prefix.length);
  const afterDot = beforePrefix.endsWith('.') && !beforePrefix.endsWith(SPREAD_OPERATOR_SUFFIX);
  if (afterDot && !memberAccessAllowed(beforePrefix)) return [];
  const labels = labelCandidates(context.lessonBaseUrl, lessons);
  const candidates = afterDot ? labels.filter((candidate) => candidate.member) : [...labels, ...snippetCandidates()].filter((candidate) => !candidate.member);
  const wanted = fold(prefix);
  return candidates
    .filter((candidate) => fold(candidate.item.label).startsWith(wanted))
    .toSorted((left, right) => compareText(left.sortKey, right.sortKey))
    .map((candidate) => candidate.item);
}
