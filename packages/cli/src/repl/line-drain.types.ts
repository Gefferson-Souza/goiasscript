export interface LineDrain {
  push(line: string): void;
  take(): string | undefined;
  current(): Promise<void> | null;
}

export interface LineDrainHooks {
  readonly processLine: (line: string) => Promise<void>;
  readonly onLine: () => void;
  readonly isStopped: () => boolean;
  readonly onIdle: () => void;
}
