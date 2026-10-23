import type { CliInvocation, ChildProcessLike, ExecFileLike } from '../../src/commands/commands.types.ts';

export interface FakeOutcome {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly spawnErrorCode?: string;
}

export interface FakeExecFileOptions {
  readonly outcomes?: readonly FakeOutcome[];
  readonly manual?: boolean;
}

export interface RecordedCall {
  readonly file: string;
  readonly args: readonly string[];
  readonly options: CliInvocation['options'];
}

export interface FakeChild extends ChildProcessLike {
  readonly stdinWritten: string[];
  readonly stdinErrorListeners: ((error: Error) => void)[];
  killCount: number;
  emitStdout(text: string): void;
  emitStderr(text: string): void;
  finish(outcome: FakeOutcome): void;
}

export interface FakeExecFile {
  readonly calls: RecordedCall[];
  readonly children: FakeChild[];
  readonly execFile: ExecFileLike;
}
