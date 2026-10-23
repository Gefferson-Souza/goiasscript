export interface CompletionContext {
  readonly linePrefix: string;
  readonly lessonBaseUrl: string | null;
}

export interface SnippetDefinition {
  readonly prefix: string;
  readonly body: readonly string[];
}
