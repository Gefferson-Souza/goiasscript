export interface FencedBlock {
  readonly line: number;
  readonly tokens: readonly string[];
  readonly code: string;
}

export interface ProseLine {
  readonly line: number;
  readonly text: string;
}

export interface ScannedMarkdown {
  readonly fenced: readonly FencedBlock[];
  readonly prose: readonly ProseLine[];
}
