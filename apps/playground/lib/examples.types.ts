export interface ExampleEntry {
  readonly id: string;
  readonly title: string;
  readonly file: string;
}

export interface ExampleResponse {
  readonly ok: boolean;
  json(): Promise<unknown>;
  text(): Promise<string>;
}

export type ExampleFetcher = (url: string) => Promise<ExampleResponse>;
