export interface RunLessonProgramResult {
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number | null;
  readonly timedOut: boolean;
}

export interface RunLessonProgramOptions {
  readonly timeoutMs?: number;
  readonly baseDir?: string;
}
