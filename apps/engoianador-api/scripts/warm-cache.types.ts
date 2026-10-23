import type { FetchPort } from '../src/providers/provider.types';

export interface WarmCacheOptions {
  readonly baseUrl: string;
  readonly fetchFn: FetchPort;
}

export interface WarmFailure {
  readonly label: string;
  readonly reason: string;
}

export interface WarmCacheReport {
  readonly warmed: number;
  readonly failed: readonly WarmFailure[];
}
