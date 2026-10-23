export type IntegrationScenario = 'trusted' | 'untrusted';

export interface ChildCall {
  readonly api: 'execFile' | 'spawn';
  readonly file: string;
  readonly args: readonly string[];
  readonly options: Readonly<Record<string, unknown>>;
}

export interface ChildSpy {
  readonly restore: () => void;
  readonly settled: () => Promise<void>;
}

export interface ChildProcessModule {
  execFile: (...params: readonly unknown[]) => unknown;
  spawn: (...params: readonly unknown[]) => unknown;
}

export interface LaunchInput {
  readonly scenario: IntegrationScenario;
  readonly extensionDir: string;
  readonly suiteEntry: string;
  readonly userDataDir: string;
  readonly extensionsDir: string;
  readonly workspaceDir: string;
}

export interface IntegrationOptions {
  readonly vscodeVersion: string;
  readonly extensionDir?: string;
}
