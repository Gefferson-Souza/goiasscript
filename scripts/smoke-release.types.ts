export type SmokeDist = 'latest' | 'next';

export type SmokeStep = 'registry' | 'install' | 'version' | 'license';

export interface ExecResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

export interface ExecPort {
  run(command: string, args: readonly string[]): Promise<ExecResult>;
  exists(file: string): Promise<boolean>;
}

export interface ReleaseSmokeOptions {
  readonly dist: SmokeDist;
  readonly exec: ExecPort;
  readonly tmpDir: string;
}

export type SmokeResult =
  | { readonly ok: true; readonly version: string }
  | { readonly ok: false; readonly step: SmokeStep; readonly message: string };
