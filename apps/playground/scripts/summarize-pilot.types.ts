export type PilotOrigin = 'goias' | 'fora';

export interface ConfusingMessage {
  readonly code: string;
  readonly comment: string;
}

export interface ConfusingLesson {
  readonly lessonId: string;
  readonly comment: string;
}

export interface PilotAnswer {
  readonly learnerId: string;
  readonly origin: PilotOrigin;
  readonly lessonsCompleted: readonly string[];
  readonly confusingMessages: readonly ConfusingMessage[];
  readonly confusingLessons: readonly ConfusingLesson[];
}

export type ParsePilotAnswerResult =
  | { readonly ok: true; readonly answer: PilotAnswer }
  | { readonly ok: false; readonly reason: string };

export interface RankedEntry {
  readonly key: string;
  readonly count: number;
}

export interface PilotSummary {
  readonly learners: number;
  readonly completedLessons1to5: number;
  readonly s8Met: boolean;
  readonly topCodes: readonly RankedEntry[];
  readonly topLessons: readonly RankedEntry[];
}

export interface SummarizePilotOptions {
  readonly dir: string;
}

export interface SummarizePilotIo {
  readonly out: (text: string) => void;
  readonly err: (text: string) => void;
}
