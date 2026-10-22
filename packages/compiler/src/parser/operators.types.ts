export interface OperatorInfo {
  readonly precedence: number;
  readonly js: string;
  readonly logical: boolean;
  readonly assignment: boolean;
}
