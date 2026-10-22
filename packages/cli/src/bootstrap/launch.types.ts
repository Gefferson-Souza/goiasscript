export interface CliEntryPoints {
  readonly runGoiasScript: (argv: readonly string[]) => Promise<number>;
  readonly runGoias: (argv: readonly string[]) => Promise<number>;
}

export interface LaunchDependencies {
  readonly nodeVersion: string;
  readonly loadCli: () => Promise<CliEntryPoints>;
  readonly writeError: (text: string) => void;
  readonly setExitCode: (code: number) => void;
}
