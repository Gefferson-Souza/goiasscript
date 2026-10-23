import type { LogPort } from './log.types';
import type { ProviderChain, ProviderResult } from './ports.types';
import { REFUNDABLE_FAILURES } from './refund.constants';
import { NO_PROVIDER_NAME } from './providers/provider.constants';
import type { ProviderPort } from './providers/provider.types';

type FailedResult = Extract<ProviderResult, { readonly ok: false }>;

// A falha provocável por quem chama prevalece sobre a de infraestrutura.
function pickFailure(current: FailedResult | null, attempt: FailedResult): FailedResult {
  if (current === null) return attempt;
  return !REFUNDABLE_FAILURES.has(current.failure) && REFUNDABLE_FAILURES.has(attempt.failure) ? current : attempt;
}

export function createProviderChain(providers: readonly ProviderPort[], log?: LogPort): ProviderChain {
  return {
    async complete(text, signal) {
      let worst: FailedResult | null = null;
      for (const provider of providers) {
        const attempt = await provider.complete(text, signal);
        if (attempt.ok) return attempt;
        log?.warn('provider failed', `${attempt.provider}:${attempt.failure}`);
        worst = pickFailure(worst, attempt);
        if (signal.aborted) return worst;
      }
      return worst ?? { ok: false, failure: 'model-disabled', provider: NO_PROVIDER_NAME };
    },
  };
}
