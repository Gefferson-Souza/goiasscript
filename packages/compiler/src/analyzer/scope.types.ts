import type { BindingKind } from '../api.types.ts';

export type DeclarationKind = BindingKind | 'param' | 'catch';
export type DeclareOutcome = 'ok' | 'duplicate';
export type ScopeKind = 'program' | 'function' | 'block';

export interface Binding {
  readonly name: string;
  readonly kind: DeclarationKind;
  readonly start: number;
  readonly fromSession: boolean;
}
