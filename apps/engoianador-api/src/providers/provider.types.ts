import type { Env } from '../env.types';
import type { LogPort } from '../log.types';

export interface ProviderChainDeps {
  readonly env: Env;
  readonly log: LogPort;
}
