import type { MarkdownContent } from './markdown-content.types.ts';

export interface PositionLike {
  readonly lineNumber: number;
  readonly column: number;
}

export interface WordLike {
  readonly word: string;
  readonly startColumn: number;
  readonly endColumn: number;
}

export interface TextModelLike {
  getLineContent(lineNumber: number): string;
  getWordAtPosition(position: PositionLike): WordLike | null;
}

export interface CompletionProviderLike {
  readonly triggerCharacters: readonly string[];
  provideCompletionItems(model: TextModelLike, position: PositionLike): { readonly suggestions: readonly unknown[] };
}

export interface HoverProviderLike {
  provideHover(
    model: TextModelLike,
    position: PositionLike,
  ): { readonly range: { readonly startLineNumber: number; readonly endLineNumber: number; readonly startColumn: number; readonly endColumn: number }; readonly contents: readonly MarkdownContent[] } | null;
}

export interface MonacoLike {
  readonly languages: {
    register(language: { readonly id: string }): void;
    setMonarchTokensProvider(languageId: string, definition: unknown): unknown;
    registerCompletionItemProvider(languageId: string, provider: CompletionProviderLike): unknown;
    registerHoverProvider(languageId: string, provider: HoverProviderLike): unknown;
  };
}
