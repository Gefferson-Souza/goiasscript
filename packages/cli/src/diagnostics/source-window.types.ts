export interface SourceMarkRequest {
  readonly line: number;
  readonly column: number;
  readonly endLine: number;
  readonly endColumn: number;
}

export interface MarkedLine {
  readonly text: string;
  readonly padding: number;
  readonly width: number;
}
