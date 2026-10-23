import type { FetchPort } from '../src/providers/provider.types.ts';

export interface ContractOptions {
  readonly baseUrl: string | null;
  readonly apiKey: string | undefined;
  readonly model: string;
  readonly fetchFn: FetchPort;
}

export type ContractResult =
  | { readonly status: 'passed' }
  | { readonly status: 'skipped'; readonly reason: string }
  | { readonly status: 'failed'; readonly problems: readonly string[] };
