export type ReplCommandId = 'exit' | 'history' | 'bindings' | 'reset' | 'clear' | 'help';

export interface ReplCommandSpec {
  readonly id: ReplCommandId;
  readonly name: string;
  readonly asciiName?: string;
}

export type ReplCommandParse =
  | { readonly kind: 'command'; readonly id: ReplCommandId }
  | { readonly kind: 'unknown'; readonly typed: string; readonly suggestion?: string };
