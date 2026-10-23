export interface Heartbeat {
  readonly maxGapMs: () => Promise<number>;
  readonly sampleCount: () => Promise<number>;
}
