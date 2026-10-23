import type { GateProblem, TraceabilityFs } from './gate.types.ts';

export type FindingSeverity = 'CRITICAL' | 'HIGH';
export type ClosureKind = 'test' | 'intentional' | 'adr';
export type ChecklistState = 'closed' | 'open';

export interface Finding {
  readonly id: string;
  readonly severity: FindingSeverity;
  readonly title: string;
  readonly report: string;
}

export interface Closure {
  readonly id: string;
  readonly kind: ClosureKind;
  readonly ref: string;
  readonly testName?: string;
}

export interface ChecklistRow {
  readonly finding: Finding;
  readonly closures: readonly Closure[];
  readonly state: ChecklistState;
  readonly reasons: readonly string[];
}

export type ChecklistFs = TraceabilityFs;

export interface ExpectedFailPort {
  readonly list: () => readonly string[];
}

export interface ChecklistInput {
  readonly rows: readonly ChecklistRow[];
  readonly orphans: readonly string[];
  readonly emptyReports: readonly string[];
  readonly expectedFail: readonly string[];
}

export type ChecklistProblems = readonly GateProblem[];
