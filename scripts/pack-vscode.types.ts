export interface PackVscodeOptions {
  readonly outDir: string;
  readonly env?: Readonly<Record<string, string | undefined>>;
}

export interface PackVscodeResult {
  readonly vsix: string;
  readonly sha256: string;
}
