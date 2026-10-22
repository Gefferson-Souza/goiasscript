import type { ExitCode } from '../../src/exit-codes.types.ts';
import type { FakeProcessHost, FakeProcessHostOptions } from './fake-process-host.types.ts';

export function createFakeProcessHost(options: FakeProcessHostOptions = {}): FakeProcessHost {
  const exitHandlers: (() => void)[] = [];
  const rejectionHandlers: ((reason: unknown) => void)[] = [];
  const exceptionHandlers: ((error: unknown) => void)[] = [];
  const state: { exitCode: ExitCode | undefined; terminated: ExitCode | undefined } = { exitCode: undefined, terminated: undefined };
  return {
    get exitCode() {
      return state.exitCode;
    },
    get terminated() {
      return state.terminated;
    },
    onExit(handler) {
      exitHandlers.push(handler);
    },
    onUnhandledRejection(handler) {
      rejectionHandlers.push(handler);
    },
    onUncaughtException(handler) {
      exceptionHandlers.push(handler);
    },
    importModule: (fileUrl) => (options.importModule ?? (() => Promise.resolve({})))(fileUrl),
    setExitCode(code) {
      state.exitCode = code;
    },
    terminate(code) {
      state.terminated = code;
    },
    fireExit() {
      exitHandlers.forEach((handler) => {
        handler();
      });
    },
    fireUnhandledRejection(reason) {
      rejectionHandlers.forEach((handler) => {
        handler(reason);
      });
    },
    fireUncaughtException(error) {
      exceptionHandlers.forEach((handler) => {
        handler(error);
      });
    },
  };
}
