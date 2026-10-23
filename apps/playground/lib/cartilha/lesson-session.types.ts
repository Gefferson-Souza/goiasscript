import type { CompileView } from '../compile-service.types.ts';
import type { RunViewState } from '../run/run-state-view.types.ts';
import type { GradeResult } from './grade-exercise.types.ts';

export type LessonTab = 'example' | 'exercise';

export interface LessonSources {
  readonly example: string;
  readonly exercise: string;
}

export interface LessonSession {
  readonly tab: LessonTab;
  readonly source: string;
  readonly markers: CompileView['markers'];
  readonly runView: RunViewState;
  readonly running: boolean;
  readonly grade: GradeResult | null;
  readonly grading: boolean;
  readonly done: boolean;
  readonly selectTab: (tab: LessonTab) => void;
  readonly edit: (value: string) => void;
  readonly runExample: () => void;
  readonly stop: () => void;
  readonly answer: (value: string) => void;
  readonly check: () => void;
}
