import type { ExitCode } from '../../src/exit-codes.types.ts';
import type { ProcessHost } from '../../src/run/process-host.types.ts';

export interface FakeProcessHostOptions {
  readonly importModule?: (fileUrl: string) => Promise<unknown>;
}

export interface FakeProcessHost extends ProcessHost {
  readonly exitCode: ExitCode | undefined;
  readonly terminated: ExitCode | undefined;
  fireExit(): void;
  fireUnhandledRejection(reason: unknown): void;
  fireUncaughtException(error: unknown): void;
}
