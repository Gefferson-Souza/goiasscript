import { GROQ_TIMEOUT_MS, WORKERS_AI_TIMEOUT_MS } from '../engoiana.constants';
import { createProviderChain } from '../engoiana';
import type { ProviderChain } from '../ports.types';
import { createGroqProvider } from './groq';
import type { WorkerProviderChainDeps } from './provider.types';
import { createWorkersAiProvider } from './workers-ai';

export function createWorkerProviderChain(deps: WorkerProviderChainDeps): ProviderChain {
  const { env, config, log } = deps;
  const providers = [
    createGroqProvider({
      apiKey: env.GROQ_API_KEY,
      model: config.groqModel,
      fetchFn: deps.fetchFn ?? ((url, init) => fetch(url, init)),
      timeoutMs: GROQ_TIMEOUT_MS,
    }),
    createWorkersAiProvider({ ai: env.AI, model: config.workersAiModel, timeoutMs: WORKERS_AI_TIMEOUT_MS }),
  ];
  return createProviderChain(providers, log);
}
