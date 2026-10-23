import type { RunEvent } from './runner-client.types.ts';

export type RunViewStatus = 'idle' | 'running' | 'asking' | 'finished' | 'failed' | 'timeout' | 'stopped';

export interface RunViewLine {
  readonly stream: 'out' | 'err';
  readonly text: string;
}

export interface RunViewState {
  readonly status: RunViewStatus;
  readonly lines: readonly RunViewLine[];
  readonly pendingPrompt: string | null;
  readonly notice: string | null;
}

export type RunViewAction = RunEvent | { readonly kind: 'start' } | { readonly kind: 'answer' };
