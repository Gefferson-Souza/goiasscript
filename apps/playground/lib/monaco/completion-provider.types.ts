import type { MarkdownContent } from './markdown-content.types.ts';

export interface CompletionContext {
  readonly prefix: string;
  readonly afterDot: boolean;
}

export interface CompletionEntry {
  readonly label: string;
  readonly detail: string;
  readonly kind: number;
  readonly insertText: string;
  readonly insertTextRules?: number;
  readonly sortText: string;
  readonly documentation?: MarkdownContent;
}

export interface LessonLookup {
  readonly lessonIdOf: (term: string) => string | undefined;
  readonly lessonUrlOf: (lessonId: string) => string | undefined;
}

export interface SnippetDefinition {
  readonly prefix: string;
  readonly body: readonly string[];
  readonly description: string;
}

export interface Candidate {
  readonly entry: CompletionEntry;
  readonly member: boolean;
}
