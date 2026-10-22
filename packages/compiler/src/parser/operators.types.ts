export interface OperatorInfo {
  readonly precedence: number;
  readonly js: string;
  readonly logical: boolean;
  readonly assignment: boolean;
  readonly foreign: boolean;
}

export type ForeignOperator = Omit<OperatorInfo, 'foreign'>;
