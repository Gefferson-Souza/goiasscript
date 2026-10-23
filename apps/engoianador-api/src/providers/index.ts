import { rewriteText } from '../engoiana';
import type { ProviderChain, ProviderResult } from '../ports.types';
import type { ProviderChainDeps } from './provider.types';

const PROVIDER_NAME = 'engoiana';

export function createProviderChain(deps: ProviderChainDeps): ProviderChain {
  return {
    async complete(text: string): Promise<ProviderResult> {
      try {
        return { ok: true, text: await rewriteText(text, deps.env, deps.log), provider: PROVIDER_NAME };
      } catch {
        return { ok: false, failure: 'server-error', provider: PROVIDER_NAME };
      }
    },
  };
}
