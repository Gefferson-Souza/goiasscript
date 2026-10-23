import type { FetchPort } from '../src/providers/provider.types';

export interface VerifyModelOptions {
  readonly apiKey: string | undefined;
  readonly model: string;
  readonly fetchFn: FetchPort;
}

export type VerifyModelStatus = 'ok' | 'missing' | 'inactive' | 'unreachable' | 'skipped';

export interface VerifyModelResult {
  readonly status: VerifyModelStatus;
}

export interface RunVerifyModelOptions extends VerifyModelOptions {
  readonly require: boolean;
}

export interface VerifyModelOutcome {
  readonly exitCode: 0 | 1;
  readonly message: string;
}
