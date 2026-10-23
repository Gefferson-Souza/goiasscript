export interface LessonSourceOptions {
  readonly id?: string | null;
  readonly order?: number;
  readonly terms?: readonly string[];
  readonly solution?: string;
  readonly expectedStdout?: string | null;
  readonly stdinFile?: string;
  readonly extraKeys?: readonly string[];
  readonly blocks?: readonly string[];
}
