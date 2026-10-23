export interface Heartbeat {
  readonly maxGapMs: () => Promise<number>;
  readonly sampleCount: () => Promise<number>;
  readonly reset: () => Promise<void>;
}
