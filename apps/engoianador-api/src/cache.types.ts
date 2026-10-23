import type { LogPort } from './log.types';

export interface KvPort {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options: { readonly expirationTtl: number }): Promise<void>;
}

export interface CacheOptions {
  readonly kv: KvPort;
  readonly ttlSec: number;
  readonly promptVersion: string;
  readonly modelId: string;
  readonly log: LogPort;
}
