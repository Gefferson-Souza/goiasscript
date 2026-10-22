export interface InstalledRunOptions {
  readonly cwd?: string;
  readonly env?: Readonly<Record<string, string>>;
  readonly input?: string;
  readonly trackModules?: boolean;
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

export interface InstalledProcess {
  readonly stdin: NodeJS.WritableStream;
  readonly result: Promise<InstalledRun>;
}

export type ShimName = 'goiasscript' | 'goias';

export type ShimArgument = 'dedo_de_prosa';
