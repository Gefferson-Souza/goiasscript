export interface ProgramEnvironment {
  readonly scope: object;
  readonly importModule: (url: string) => Promise<unknown>;
}

export interface ExecuteMessage {
  readonly type: 'gs:executar';
  readonly runId: number;
  readonly code: string;
}
