import type { MARKER_SEVERITY } from './diagnostic-markers.constants.ts';
import type { EditorRange } from './editor-position.types.ts';

export type MarkerSeverityValue = (typeof MARKER_SEVERITY)[keyof typeof MARKER_SEVERITY];

export interface EditorMarker extends EditorRange {
  readonly code: string;
  readonly severity: MarkerSeverityValue;
  readonly message: string;
  readonly lessonUrl?: string;
}

export interface MarkerView {
  readonly markers: readonly EditorMarker[];
  readonly hiddenMarkerCount: number;
}

export type LessonUrlOf = (lessonId: string) => string | undefined;
