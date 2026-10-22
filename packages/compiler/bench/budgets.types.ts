export interface Ratchets {
  readonly compile10kLinesMs: number | null;
  readonly brotliBytes: number | null;
  readonly acceptanceMutation: number;
  readonly acceptanceProgram: number;
  readonly referenceCalibrationMs: number | null;
}

export interface BudgetMeasures {
  readonly pathologicalSpacesMs: number;
  readonly compile10kLinesMs: number;
  readonly machineFactor: number;
}
