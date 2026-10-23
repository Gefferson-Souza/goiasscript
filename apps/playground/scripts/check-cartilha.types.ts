export interface CheckLessonsOptions {
  readonly dir: string;
  readonly args: readonly string[];
}

export interface CheckLessonsIo {
  readonly out: (text: string) => void;
  readonly err: (text: string) => void;
}
