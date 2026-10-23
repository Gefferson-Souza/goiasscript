import type { LogPort } from './log.types';
import type { ProviderChain, ProviderResult } from './ports.types';
import { NO_PROVIDER_NAME } from './providers/provider.constants';
import type { ProviderPort } from './providers/provider.types';

export function createProviderChain(providers: readonly ProviderPort[], log?: LogPort): ProviderChain {
  return {
    async complete(text, signal) {
      let last: ProviderResult = { ok: false, failure: 'model-disabled', provider: NO_PROVIDER_NAME };
      for (const provider of providers) {
        last = await provider.complete(text, signal);
        if (last.ok) return last;
        log?.warn('provider failed', `${last.provider}:${last.failure}`);
      }
      return last;
    },
  };
}
