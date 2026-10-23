import type { CompileResult } from '@goiasscript/compiler';
import type { RunLessonProgramResult } from './run-lesson-program.types.ts';

export type BlockMode = 'editable' | 'static' | 'expected-error';

export interface LessonBlock {
  readonly mode: BlockMode;
  readonly code: string;
  readonly line: number;
  readonly expectedCode?: string;
}

export interface LessonExercise {
  readonly prompt: string;
  readonly starter: string;
  readonly solution: string;
  readonly expectedStdout: string;
  readonly stdin?: readonly string[];
}

export interface Lesson {
  readonly file: string;
  readonly id: string;
  readonly order: number;
  readonly title: string;
  readonly summary: string;
  readonly terms: readonly string[];
  readonly exercise: LessonExercise;
  readonly blocks: readonly LessonBlock[];
  readonly example: LessonBlock;
  readonly bodyMarkdown: string;
  readonly solutionLine: number;
}

export interface LessonFrontmatter {
  readonly id: string;
  readonly order: number;
  readonly title: string;
  readonly summary: string;
  readonly terms: readonly string[];
  readonly exercise: {
    readonly prompt: string;
    readonly starter: string;
    readonly solution: string;
    readonly expectedStdout: string;
    readonly stdinFile?: string;
  };
}

export interface FrontmatterIssue {
  readonly key: string;
  readonly text: string;
}

export type FrontmatterResult =
  | { readonly ok: true; readonly value: LessonFrontmatter }
  | { readonly ok: false; readonly issues: readonly FrontmatterIssue[] };

export interface LessonProblem {
  readonly lessonId: string | null;
  readonly line: number | null;
  readonly message: string;
}

export type ParseLessonResult =
  | { readonly ok: true; readonly lesson: Lesson }
  | { readonly ok: false; readonly problems: readonly LessonProblem[] };

export interface LoadLessonsResult {
  readonly lessons: readonly Lesson[];
  readonly problems: readonly LessonProblem[];
}

export type ReadStdin = (stdinFile: string) => string;

export interface CheckLessonBlocksDeps {
  readonly compile: (source: string) => CompileResult;
  readonly run?: (code: string, stdin: string) => Promise<RunLessonProgramResult>;
}

export interface ProgramToCheck {
  readonly source: string;
  readonly line: number;
  readonly label: string;
  readonly stdin: string;
}
