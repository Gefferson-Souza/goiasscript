import type vm from 'node:vm';
import type { CompileSuccess, Diagnostic, ReplSession, Tone } from '@goiasscript/compiler';
import type { CliIo } from '../io.types.ts';
import type { CANCELLED } from './repl.constants.ts';

export type ReplEvaluation =
  | { readonly kind: 'incomplete' }
  | { readonly kind: 'failed'; readonly diagnostics: readonly Diagnostic[]; readonly source: string }
  | { readonly kind: 'done'; readonly diagnostics: readonly Diagnostic[]; readonly echo?: string }
  | { readonly kind: 'threw'; readonly diagnostic: Diagnostic; readonly source: string }
  | { readonly kind: 'interrupted' }
  | { readonly kind: 'cancelled' };

export interface ReplEngine {
  evaluate(source: string): Promise<ReplEvaluation>;
  hasPendingQuestion(): boolean;
  answer(line: string): void;
  cancelPendingQuestion(): void;
  endOfInput(): void;
  reset(): void;
  readonly session: ReplSession;
}

export interface ReplEngineOptions {
  readonly io: Pick<CliIo, 'out' | 'err'>;
  readonly tone: Tone;
  readonly entryTimeoutMs?: number;
}

export interface EntryRequest {
  readonly source: string;
  readonly compiled: CompileSuccess;
  readonly context: vm.Context;
  readonly tone: Tone;
  readonly timeoutMs?: number;
  readonly cancellation: Promise<typeof CANCELLED>;
}
