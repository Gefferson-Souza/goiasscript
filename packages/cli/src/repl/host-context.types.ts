import type vm from 'node:vm';

export interface PendingQuestion {
  readonly resolve: (answer: string) => void;
  readonly reject: (error: unknown) => void;
}

export interface QuestionChannel {
  hasPending(): boolean;
  answer(line: string): void;
  discard(): void;
  end(): void;
}

export interface HostContext {
  readonly context: vm.Context;
  readonly questions: QuestionChannel;
  dispose(): void;
}
