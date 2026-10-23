export type LessonIndexMode = '--write' | '--check';

export interface LessonIndexTargets {
  readonly contentDir: string;
  readonly playgroundFile: string;
  readonly extensionFile: string;
  readonly mode: LessonIndexMode;
}

export interface LessonIndexIo {
  readonly read: (path: string) => string;
  readonly write: (path: string, text: string) => void;
  readonly out: (text: string) => void;
  readonly err: (text: string) => void;
}
