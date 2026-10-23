export type HostDiagnosticKind = 'loadFailure' | 'unreadableMessage';

export interface HostDiagnosticText {
  readonly message: string;
  readonly help: string;
}
