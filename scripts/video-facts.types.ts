export type TestsSource = 'ci' | 'local';

export interface CliRun {
  readonly command: string;
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number;
}

export interface CliRunOptions {
  readonly cwd?: string;
  readonly stdin?: string;
}

export type EngoianadorFact =
  | { readonly status: 'ok'; readonly request: string; readonly response: string }
  | { readonly status: 'pending-owner' };

export interface VideoFacts {
  readonly generatedAt: string;
  readonly version: string;
  readonly tests: { readonly count: number; readonly source: TestsSource };
  readonly cli: readonly CliRun[];
  readonly varKeywordToLet: { readonly before: string; readonly after: string };
  readonly engoianador: EngoianadorFact;
}

export interface VideoFactsDeps {
  readonly readVersion: () => Promise<string>;
  readonly countTests: () => Promise<{ readonly count: number; readonly source: TestsSource }>;
  readonly runCli: (args: readonly string[], options?: CliRunOptions) => Promise<CliRun>;
  readonly fetchEngoianador: ((text: string) => Promise<string>) | null;
  readonly now: () => Date;
}

export interface VideoFactsArgs {
  readonly out: string;
  readonly testsFrom: string | null;
}

export interface VideoFactsIo {
  readonly out: (text: string) => void;
  readonly err: (text: string) => void;
}

export interface Redaction {
  readonly value: string;
  readonly replacement: string;
}

export interface VideoFactsRuntime {
  readonly deps: VideoFactsDeps;
  readonly redactions: readonly Redaction[];
  readonly dispose: () => void;
}
