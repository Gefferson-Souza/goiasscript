import type { ProviderResult } from '../ports.types';
import { buildMessages } from '../prompt';
import { answerFrom, failureFromError, failureOf } from './answer';
import { WORKERS_AI_PROVIDER_NAME } from './provider.constants';
import type { ProviderPort, WorkersAiProviderOptions } from './provider.types';

const ABORTED_MESSAGE = 'aborted';

interface WorkersAiOutput {
  readonly response?: unknown;
}

function abortedBy(signal: AbortSignal): Promise<never> {
  return new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => {
      reject(signal.reason instanceof Error ? signal.reason : new Error(ABORTED_MESSAGE));
    });
  });
}

function textOf(output: unknown): string | undefined {
  const response = (output as WorkersAiOutput | null)?.response;
  return typeof response === 'string' ? response : undefined;
}

export function createWorkersAiProvider(options: WorkersAiProviderOptions): ProviderPort {
  return {
    name: WORKERS_AI_PROVIDER_NAME,
    async complete(text, signal): Promise<ProviderResult> {
      const { ai } = options;
      if (ai === undefined) return failureOf(WORKERS_AI_PROVIDER_NAME, 'model-disabled');
      const guarded = AbortSignal.any([signal, AbortSignal.timeout(options.timeoutMs)]);
      try {
        const output = await Promise.race([ai.run(options.model, { messages: buildMessages(text) }), abortedBy(guarded)]);
        return answerFrom(WORKERS_AI_PROVIDER_NAME, textOf(output));
      } catch (error) {
        return failureFromError(WORKERS_AI_PROVIDER_NAME, error);
      }
    },
  };
}
