import type { KeywordEntry } from '@goiasscript/language';

export type NumberForm = 'decimal' | 'hex' | 'binary' | 'octal' | 'bigint' | 'separator';
export type TokenKind = 'keyword' | 'identifier' | 'number' | 'string' | 'template' | 'punctuator' | 'newline' | 'end-of-file' | 'invalid';
export type TriviaKind = 'whitespace' | 'line-comment' | 'block-comment' | 'bom';

export interface Trivia {
  readonly kind: TriviaKind;
  readonly start: number;
  readonly end: number;
  readonly containsNewline: boolean;
}

export interface Token {
  readonly kind: TokenKind;
  readonly start: number;
  readonly end: number;
  readonly text: string;
  readonly value: string;
  readonly keyword?: KeywordEntry;
  readonly numberForm?: NumberForm;
  readonly precededByNewline: boolean;
  readonly leadingTrivia: readonly Trivia[];
}

export interface RawDiagnostic {
  readonly code: string;
  readonly start: number;
  readonly end: number;
  readonly args: Readonly<Record<string, string>>;
}

export interface Lexer {
  next(): Token;
  peek(offset?: number): Token;
  rescanAsRegex(token: Token): Token;
  readonly diagnostics: readonly RawDiagnostic[];
}

export interface ScanContext {
  readonly text: string;
  report(code: string, start: number, end: number, args?: Readonly<Record<string, string>>): void;
}

export interface ScannedToken {
  readonly kind: TokenKind;
  readonly end: number;
  readonly value: string;
  readonly numberForm?: NumberForm;
  readonly keyword?: KeywordEntry;
}

export interface TextSpan {
  readonly start: number;
  readonly end: number;
}

export interface TriviaStep {
  readonly trivia: readonly Trivia[];
  readonly end: number;
  readonly newline: TextSpan | null;
  readonly unterminatedComment: TextSpan | null;
}

export interface Escape {
  readonly end: number;
  readonly value: string;
}
