export type HostDiagnosticKind = 'loadFailure' | 'unreadableMessage' | 'compileFailure';

export interface HostDiagnosticText {
  readonly message: string;
  readonly help: string;
}
