export interface SourceText {
  readonly text: string;
  readonly fileName: string;
  readonly lineStarts: readonly number[];
}
