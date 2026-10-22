export interface RealRunOptions {
  readonly cwd: string;
  readonly env?: Readonly<Record<string, string>>;
}

export interface RealRunResult {
  readonly exitCode: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

export interface RunningCli {
  readonly tmpDir: string;
  readonly exited: () => boolean;
  readonly stderr: () => string;
  readonly kill: () => void;
  readonly closed: Promise<RealRunResult>;
}
