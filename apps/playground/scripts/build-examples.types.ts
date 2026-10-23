export interface BuildExamplesOptions {
  readonly sourceDir: string;
  readonly outDir: string;
}

export interface ExamplesIo {
  out(text: string): void;
  err(text: string): void;
}

export interface ExampleIndexEntry {
  readonly id: string;
  readonly title: string;
}
