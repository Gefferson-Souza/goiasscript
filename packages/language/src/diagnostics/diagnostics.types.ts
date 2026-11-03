export type DiagnosticSeverity = 'error' | 'warning';
export type ToneKey = 'raiz' | 'neutro';
export interface DiagnosticVariant {
  readonly messages: Readonly<Record<ToneKey, string>>;
  readonly help?: Readonly<Record<ToneKey, string>>;
}
export interface DiagnosticDefinition {
  readonly code: string;
  readonly severity: DiagnosticSeverity;
  readonly title: string;
  readonly messages: Readonly<Record<ToneKey, string>>;
  readonly help?: Readonly<Record<ToneKey, string>>;
  readonly lesson?: string;
  readonly variants?: Readonly<Record<string, DiagnosticVariant>>;
  readonly example: string;
  readonly since: string;
}

export interface DiagnosticTexts {
  readonly message: string;
  readonly help?: string;
}
