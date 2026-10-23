export type HostileExpectation = 'compile-error' | 'tried-and-failed' | 'stopped-by-limit';

export interface HostileProgram {
  readonly name: string;
  readonly expect: HostileExpectation;
  readonly source: (canaryUrl: string) => string;
  // Mensagens aceitas na linha "deu ruim: ..." (só nos ataques que compilam e tentam).
  readonly failurePatterns?: readonly RegExp[];
}
