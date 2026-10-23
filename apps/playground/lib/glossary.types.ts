export type GlossaryGroup = 'keyword' | 'library';

export interface GlossaryEntry {
  readonly term: string;
  readonly js: string;
  readonly detail: string;
  readonly group: GlossaryGroup;
  readonly anchor: string;
  readonly lessonUrl?: string;
}

export interface GlossarySource {
  readonly keywords: readonly { readonly term: string; readonly js: string; readonly category: string }[];
  readonly library: readonly { readonly term: string; readonly js: string; readonly semantics?: string }[];
}
