import type { CompileSuccess, Diagnostic, Tone } from '@goiasscript/compiler';
import type { RunLimits } from '../../config/run-limits.types.ts';
import type { HostToRunner } from '../../sandbox/protocol.types.ts';
import type { OutputBuffer } from './output-buffer.types.ts';

export type TruncationReason = 'lines' | 'chars';

export type RunEvent =
  | { readonly kind: 'out'; readonly text: string }
  | { readonly kind: 'err'; readonly text: string }
  | { readonly kind: 'ask'; readonly prompt: string }
  | { readonly kind: 'failed'; readonly diagnostic: Diagnostic }
  | { readonly kind: 'truncated'; readonly reason: TruncationReason }
  | { readonly kind: 'timeout' }
  | { readonly kind: 'finished' }
  | { readonly kind: 'stopped' };

export interface WorkerPort {
  postMessage(message: HostToRunner): void;
  terminate(): void;
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  onmessageerror: ((event: MessageEvent<unknown>) => void) | null;
}

export type TimerHandle = number | object;

export interface TimerPort {
  setTimeout(handler: () => void, delayMs: number): TimerHandle;
  clearTimeout(handle: TimerHandle): void;
}

export interface RunRequest {
  readonly compiled: CompileSuccess;
  readonly source: string;
  readonly fileName: string;
}

export interface RunnerClient {
  run(request: RunRequest, onEvent: (event: RunEvent) => void): void;
  answer(value: string): void;
  stop(): void;
  dispose(): void;
}

export interface RunnerClientOptions {
  readonly createWorker: () => WorkerPort;
  readonly limits: RunLimits;
  readonly now: () => number;
  readonly timers: TimerPort;
  readonly tone?: Tone;
}

export type RunPhase = 'idle' | 'running' | 'asking' | 'finished' | 'failed' | 'timeout' | 'stopped';
export type RunSignal = 'start' | 'ask' | 'answer' | 'finish' | 'fail' | 'timeout' | 'stop';

export interface Cell<T> {
  get(): T;
  set(value: T): void;
}

export interface SessionDeps {
  readonly limits: RunLimits;
  readonly now: () => number;
  readonly timers: TimerPort;
  readonly tone: Tone;
}

export interface RunSession {
  readonly runId: number;
  readonly worker: WorkerPort;
  readonly request: RunRequest;
  readonly emit: (event: RunEvent) => void;
  readonly buffer: OutputBuffer;
  readonly phase: Cell<RunPhase>;
  readonly ready: Cell<boolean>;
  readonly idleTimer: Cell<TimerHandle | null>;
  readonly maxTimer: Cell<TimerHandle | null>;
  readonly wallTimer: Cell<TimerHandle | null>;
  readonly budgetMs: Cell<number>;
  readonly segmentStartedAt: Cell<number>;
}
