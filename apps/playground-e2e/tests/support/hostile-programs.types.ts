export type HostileExpectation = 'compile-error' | 'tried-and-failed' | 'stopped-by-limit';

export interface HostileProgram {
  readonly name: string;
  readonly expect: HostileExpectation;
  readonly source: (canaryUrl: string) => string;
}
