import type { LogPort } from './log.types';

// Única saída de log do Worker: o restante do código recebe um LogPort.
const { console: platformConsole } = globalThis;

function format(event: string, detail: string | undefined): string {
  return detail === undefined ? event : `${event} ${detail}`;
}

export const workerLog: LogPort = {
  warn: (event, detail) => {
    platformConsole.warn(format(event, detail));
  },
  error: (event, detail) => {
    platformConsole.error(format(event, detail));
  },
};
