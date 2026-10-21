import type { NumberForm } from './token.types.ts';

export interface NumberShape {
  readonly end: number;
  readonly form: NumberForm;
  readonly valid: boolean;
}

export interface DigitRun {
  readonly end: number;
  readonly separated: boolean;
  readonly malformed: boolean;
}
