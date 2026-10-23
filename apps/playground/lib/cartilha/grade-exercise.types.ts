import type { Diagnostic } from '@goiasscript/compiler';
import type { CompileView } from '../compile-service.types.ts';
import type { RunnerClient, TimerPort } from '../run/runner-client.types.ts';
import type { LessonExercise } from './lesson.types.ts';

export type Verdict = 'correct' | 'wrong' | 'compile-failed' | 'run-failed' | 'timeout';

export interface GradeResult {
  readonly verdict: Verdict;
  readonly actualStdout: string;
  readonly expectedStdout: string;
  readonly diagnostic?: Diagnostic;
  readonly reason?: string;
}

export interface GradeRequest {
  readonly source: string;
  readonly exercise: Pick<LessonExercise, 'expectedStdout' | 'stdin'>;
}

export interface GradeDeps {
  readonly compile: (source: string) => Promise<CompileView>;
  readonly runner: Pick<RunnerClient, 'run' | 'answer' | 'stop'>;
  readonly timers?: TimerPort;
  readonly ceilingMs?: number;
}
