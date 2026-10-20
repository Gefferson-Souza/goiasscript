export type KeywordClass = 'reserved' | 'contextual';
export interface KeywordInfo { readonly spelling: string; readonly js: string; readonly keywordClass: KeywordClass }

export type TokenKind = 'keyword' | 'identifier' | 'number' | 'string' | 'template' | 'punctuator' | 'newline' | 'end-of-file' | 'invalid';
export interface Token {
  readonly kind: TokenKind; readonly start: number; readonly end: number; readonly text: string; readonly value: string;
  readonly keyword?: KeywordInfo; readonly precededByNewline: boolean;
}

export interface RawDiagnostic { readonly code: string; readonly start: number; readonly end: number; readonly args: Readonly<Record<string, string>> }
export interface Lexer { next(): Token; peek(offset?: number): Token; readonly diagnostics: readonly RawDiagnostic[] }

export interface SourcePosition { readonly offset: number; readonly line: number; readonly column: number }
export interface Diagnostic { readonly code: string; readonly severity: 'error' | 'warning'; readonly line: number; readonly column: number; readonly args: Readonly<Record<string, string>> }
