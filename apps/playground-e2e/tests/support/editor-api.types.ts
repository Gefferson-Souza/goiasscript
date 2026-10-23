export interface ModelMarker {
  readonly code: string | { readonly value: string; readonly target?: { readonly path: string } } | undefined;
  readonly startLineNumber: number;
  readonly startColumn: number;
  readonly endLineNumber: number;
  readonly endColumn: number;
  readonly message: string;
}
