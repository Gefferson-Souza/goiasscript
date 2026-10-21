export type DiagnosticSeverity = 'error' | 'warning';
export type ToneKey = 'raiz' | 'neutro';
export interface DiagnosticDefinition {
  readonly code: string;
  readonly severity: DiagnosticSeverity;
  readonly title: string;
  readonly messages: Readonly<Record<ToneKey, string>>;
  readonly help?: Readonly<Record<ToneKey, string>>;
  readonly lesson?: string;
  readonly example: string;
  readonly since: string;
}
