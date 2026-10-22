import type vm from 'node:vm';

export interface PendingQuestion {
  readonly prompt: string;
  readonly resolve: (answer: string) => void;
  readonly reject: (error: unknown) => void;
}

export interface QuestionChannel {
  hasPending(): boolean;
  answer(line: string): void;
  discard(): void;
  end(): void;
}

export interface AskingChannel extends QuestionChannel {
  ask(prompt: string): Promise<string>;
}

export type TimerKind = 'timeout' | 'interval';

export interface TimerRegistry {
  schedule(kind: TimerKind, callback: (...args: readonly unknown[]) => unknown, delay: number | undefined, args: readonly unknown[]): number;
  clear(id: unknown): void;
  dispose(): void;
}

export interface HostBridge {
  readonly out: (args: readonly unknown[]) => void;
  readonly err: (args: readonly unknown[]) => void;
  readonly setTimeout: (callback: (...args: readonly unknown[]) => unknown, delay: number | undefined, args: readonly unknown[]) => number;
  readonly setInterval: (callback: (...args: readonly unknown[]) => unknown, delay: number | undefined, args: readonly unknown[]) => number;
  readonly clear: (id: unknown) => void;
  readonly ask: (prompt: string) => Promise<string>;
}

export interface HostContext {
  readonly context: vm.Context;
  readonly questions: QuestionChannel;
  dispose(): void;
}
