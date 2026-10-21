export type KeywordClass = 'reserved' | 'contextual';
export type KeywordCategory = 'declaration' | 'assignment' | 'function' | 'control' | 'class' | 'error' | 'literal' | 'operator';
export interface KeywordEntry {
  readonly spelling: string;
  readonly asciiSpelling?: string;
  readonly js: string;
  readonly keywordClass: KeywordClass;
  readonly category: KeywordCategory;
  readonly since: string;
  readonly deprecatedIn?: string;
}
