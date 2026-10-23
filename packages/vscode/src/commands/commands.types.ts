import type { Tone } from '@goiasscript/compiler';
import type { ExtensionHost } from '../host/extension-host.types.ts';

export type CliCommand = 'traduz' | 'bota_pra_moer';

export interface CliInvocation {
  readonly file: string;
  readonly args: readonly string[];
  readonly options: {
    readonly cwd: string;
    readonly env: Readonly<Record<string, string | undefined>>;
    readonly windowsHide: true;
    readonly maxBuffer: number;
  };
}

export interface ReadableLike {
  on(event: 'data', listener: (chunk: string) => void): unknown;
}

export interface ChildProcessLike {
  readonly stdin: { write(text: string): unknown } | null;
  readonly stdout: ReadableLike | null;
  readonly stderr: ReadableLike | null;
  kill(): boolean;
}

export type ExecFileCallback = (error: Error | null, stdout: string, stderr: string) => void;

export type ExecFileLike = (file: string, args: readonly string[], options: CliInvocation['options'], callback: ExecFileCallback) => ChildProcessLike;

export type GuardRefusal = 'not-file' | 'not-goiasscript' | 'untrusted';

export type GuardResult = { readonly allowed: true } | { readonly allowed: false; readonly reason: GuardRefusal };

export interface CliInvocationInput {
  readonly command: CliCommand;
  readonly documentPath: string;
  readonly cliEntry: string;
  readonly runtimePath: string;
  readonly tone: Tone;
  readonly overwrite: boolean;
  readonly hostEnv?: Readonly<Record<string, string | undefined>>;
}

export interface CommandDeps {
  readonly host: ExtensionHost;
  readonly execFile: ExecFileLike;
  readonly runtimePath: string;
}

export interface LineTerminal {
  write(text: string): void;
  onLine(handler: (line: string) => void): void;
  onInterrupt(handler: () => void): void;
  onClose(handler: () => void): void;
  close(exitCode: number): void;
}

export type CliOutcome =
  | { readonly kind: 'exited'; readonly exitCode: number; readonly stdout: string; readonly stderr: string }
  | { readonly kind: 'not-started' };
