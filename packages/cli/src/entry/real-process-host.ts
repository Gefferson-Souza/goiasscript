import type { ProcessHost } from '../run/process-host.types.ts';

export function createRealProcessHost(): ProcessHost {
  return {
    onExit: (handler) => void process.on('exit', handler),
    onUnhandledRejection: (handler) => void process.on('unhandledRejection', handler),
    onUncaughtException: (handler) => void process.on('uncaughtException', handler),
    importModule: (fileUrl) => import(fileUrl) as Promise<unknown>,
    setExitCode(code) {
      process.exitCode = code;
    },
    terminate(code) {
      process.exit(code);
    },
  };
}
