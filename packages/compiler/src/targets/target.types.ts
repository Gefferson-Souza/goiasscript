import type { LineRange } from '../api.types.ts';
import type { MappingSegment } from '../lowering/edit.types.ts';

export interface EmitResult {
  readonly code: string;
  readonly segments: readonly MappingSegment[];
  readonly helperRange: LineRange | null;
  readonly helpers: readonly string[];
}
