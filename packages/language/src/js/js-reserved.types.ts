export type JsReservedKind = 'keyword' | 'strict-reserved' | 'non-bindable' | 'global';
export interface JsReservedEntry {
  readonly name: string;
  readonly kind: JsReservedKind;
  readonly suggestion: string;
  readonly hasEquivalent: boolean;
}
export interface JsMemberEntry {
  readonly name: string;
  readonly equivalent?: string;
}
