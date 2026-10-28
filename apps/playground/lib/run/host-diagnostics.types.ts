export type HostDiagnosticKind = 'loadFailure' | 'unreadableMessage' | 'compileFailure' | 'messagesFailure';

export interface HostDiagnosticText {
  readonly message: string;
  readonly help: string;
}
