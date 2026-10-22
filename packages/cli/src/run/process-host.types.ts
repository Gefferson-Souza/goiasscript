import type { ExitCode } from '../exit-codes.types.ts';

export interface ProcessHost {
  onExit(handler: () => void): void;
  onUnhandledRejection(handler: (reason: unknown) => void): void;
  onUncaughtException(handler: (error: unknown) => void): void;
  importModule(fileUrl: string): Promise<unknown>;
  setExitCode(code: ExitCode): void;
  terminate(code: ExitCode): void;
}
