import type { LOG_STREAMS, MESSAGE_TYPES } from './protocol.constants.ts';

export type LogStream = (typeof LOG_STREAMS)[keyof typeof LOG_STREAMS];

export type HostToRunner =
  | { readonly type: typeof MESSAGE_TYPES.execute; readonly runId: number; readonly code: string }
  | { readonly type: typeof MESSAGE_TYPES.answer; readonly value: string };

export type RunnerToHost =
  | { readonly type: typeof MESSAGE_TYPES.ready }
  | { readonly type: typeof MESSAGE_TYPES.log; readonly runId: number; readonly stream: LogStream; readonly text: string }
  | { readonly type: typeof MESSAGE_TYPES.ask; readonly prompt: string }
  | { readonly type: typeof MESSAGE_TYPES.finished; readonly runId: number }
  | {
      readonly type: typeof MESSAGE_TYPES.failed;
      readonly runId: number;
      readonly stack: string;
      readonly errorName: string;
      readonly gsCode?: string;
      readonly gsLine?: number;
    };

export interface RunnerPort {
  postMessage(message: RunnerToHost): void;
}
