export interface CanaryServer {
  readonly url: string;
  readonly hits: () => readonly string[];
  readonly close: () => Promise<void>;
}
