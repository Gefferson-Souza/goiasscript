export interface InstalledRunOptions {
  readonly cwd?: string;
  readonly env?: Readonly<Record<string, string>>;
}

export interface InstalledRun {
  readonly exitCode: number | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly loadedModules: readonly string[];
}

export interface PackedTarball {
  readonly tarball: string;
  readonly sha256: string;
}
