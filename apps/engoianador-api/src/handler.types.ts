import type { WorkerConfig } from './env.types';
import type { LogPort } from './log.types';
import type { HealthReport, ProviderChain, QuotaLimiter, ResponseCache } from './ports.types';

export interface HandlerDeps {
  readonly limiter: QuotaLimiter;
  readonly providers: ProviderChain;
  readonly cache: ResponseCache;
  readonly health: () => HealthReport;
  readonly config: WorkerConfig;
  readonly log: LogPort;
}
