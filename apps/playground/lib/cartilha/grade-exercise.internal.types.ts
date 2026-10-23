import type { Verdict } from './grade-exercise.types.ts';

export interface CollectorState {
  readonly lines: readonly string[];
  readonly answers: readonly string[];
  readonly promptPrefix: string;
  readonly truncated: boolean;
}

export type CollectorEffect =
  | { readonly kind: 'none' }
  | { readonly kind: 'answer'; readonly value: string }
  | { readonly kind: 'finish'; readonly verdict: Verdict; readonly reason?: string; readonly stopRunner?: boolean };

export interface CollectorStep {
  readonly state: CollectorState;
  readonly effect: CollectorEffect;
}
