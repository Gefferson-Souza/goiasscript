export type StdlibReceiver = 'global' | 'text' | 'list' | 'textOrList' | 'number' | 'object' | 'promise' | 'error' | 'date' | 'namespace';
export type StdlibKind = 'rename' | 'property' | 'static' | 'global' | 'macro' | 'helper';
export type StdlibSemantics = 'native' | 'didactic';
export type StdlibForm = 'property' | 'method';
export type StdlibOrigin = 'owner' | '1.5' | 'proposal';
export interface Arity {
  readonly min: number;
  readonly max?: number;
}
export interface StdlibEntry {
  readonly name: string;
  readonly asciiName?: string;
  readonly receiver: StdlibReceiver;
  readonly kind: StdlibKind;
  readonly js: string;
  readonly semantics: StdlibSemantics;
  readonly form?: StdlibForm;
  readonly origin: StdlibOrigin;
  readonly arity: Arity;
  readonly helperName?: string;
  readonly requiresAsync?: boolean;
  readonly alternatives?: readonly string[];
  readonly since: string;
  readonly deprecatedIn?: string;
}
export type StdlibEntrySpec = Omit<StdlibEntry, 'asciiName' | 'semantics' | 'since'> & {
  readonly semantics?: StdlibSemantics;
  readonly since?: string;
};
