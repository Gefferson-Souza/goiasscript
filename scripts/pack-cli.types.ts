export interface PackCliOptions {
  readonly outDir: string;
}

export interface PackCliResult {
  readonly tarball: string;
  readonly sha256: string;
}
