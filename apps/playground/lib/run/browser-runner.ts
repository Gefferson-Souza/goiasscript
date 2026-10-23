import { RUN_LIMITS } from '../../config/run-limits.constants.ts';
import { createBrowserWorker } from './browser-worker.ts';
import { createRunnerClient } from './runner-client.ts';
import type { RunnerClient, TimerPort } from './runner-client.types.ts';

const browserTimers: TimerPort = {
  setTimeout: (handler, delayMs) => globalThis.setTimeout(handler, delayMs),
  clearTimeout: (handle) => {
    globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>);
  },
};

export const createBrowserRunnerClient = (): RunnerClient =>
  createRunnerClient({ createWorker: createBrowserWorker, limits: RUN_LIMITS, now: () => performance.now(), timers: browserTimers });
