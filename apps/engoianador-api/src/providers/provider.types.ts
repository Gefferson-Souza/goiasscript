import type { AiBinding, Env, WorkerConfig } from '../env.types';
import type { LogPort } from '../log.types';
import type { ProviderResult } from '../ports.types';

export type FetchPort = (url: string, init: RequestInit) => Promise<Response>;

export interface ProviderPort {
  readonly name: string;
  complete(text: string, signal: AbortSignal): Promise<ProviderResult>;
}

export interface GroqProviderOptions {
  readonly apiKey: string | undefined;
  readonly model: string;
  readonly fetchFn: FetchPort;
  readonly timeoutMs: number;
}

export interface WorkersAiProviderOptions {
  readonly ai: AiBinding | undefined;
  readonly model: string;
  readonly timeoutMs: number;
}

export interface WorkerProviderChainDeps {
  readonly env: Env;
  readonly config: WorkerConfig;
  readonly log: LogPort;
  readonly fetchFn?: FetchPort;
}
