import type { CompletionLabel } from '@goiasscript/language';

export type Completion = readonly [hits: readonly string[], token: string];

export interface FoldedLabel extends CompletionLabel {
  readonly folded: string;
}
