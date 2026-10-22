export type CompletionKind = 'keyword' | 'function' | 'property';

export interface CompletionLabel {
  readonly label: string;
  readonly canonical: string;
  readonly detail: string;
  readonly kind: CompletionKind;
  readonly member: boolean;
}
