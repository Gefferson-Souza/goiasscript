import { GROQ_ENDPOINT, GROQ_MAX_TOKENS, GROQ_TEMPERATURE } from '../engoiana.constants';
import type { GroqCompletion, GroqErrorBody } from '../groq.types';
import type { ProviderResult } from '../ports.types';
import { buildMessages } from '../prompt';
import { answerFrom, failureFromError, failureOf } from './answer';
import {
  GROQ_PROVIDER_NAME,
  HTTP_CLIENT_ERROR_MIN,
  HTTP_SERVER_ERROR_MIN,
  MODEL_DISABLED_CODES,
} from './provider.constants';
import type { GroqProviderOptions, ProviderPort } from './provider.types';

async function readErrorCode(response: Response): Promise<string | undefined> {
  try {
    const body = await response.json<GroqErrorBody>();
    return body.error?.code;
  } catch {
    return undefined;
  }
}

async function classifyHttpFailure(response: Response): Promise<ProviderResult> {
  const code = await readErrorCode(response);
  if (code !== undefined && MODEL_DISABLED_CODES.has(code)) return failureOf(GROQ_PROVIDER_NAME, 'model-disabled');
  if (response.status >= HTTP_SERVER_ERROR_MIN) return failureOf(GROQ_PROVIDER_NAME, 'server-error');
  if (response.status >= HTTP_CLIENT_ERROR_MIN) return failureOf(GROQ_PROVIDER_NAME, 'client-error');
  return failureOf(GROQ_PROVIDER_NAME, 'server-error');
}

async function requestCompletion(options: GroqProviderOptions, apiKey: string, text: string, signal: AbortSignal): Promise<ProviderResult> {
  const response = await options.fetchFn(GROQ_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: options.model,
      messages: buildMessages(text),
      temperature: GROQ_TEMPERATURE,
      max_tokens: GROQ_MAX_TOKENS,
      stream: false,
    }),
    signal,
  });
  if (!response.ok) return classifyHttpFailure(response);
  const data = await response.json<GroqCompletion>();
  return answerFrom(GROQ_PROVIDER_NAME, data.choices?.[0]?.message?.content);
}

export function createGroqProvider(options: GroqProviderOptions): ProviderPort {
  return {
    name: GROQ_PROVIDER_NAME,
    async complete(text, signal) {
      if (options.apiKey === undefined || options.apiKey === '') return failureOf(GROQ_PROVIDER_NAME, 'model-disabled');
      // Sem o teto de tempo, uma Groq travada seguraria o Worker até o limite de CPU.
      const guarded = AbortSignal.any([signal, AbortSignal.timeout(options.timeoutMs)]);
      try {
        return await requestCompletion(options, options.apiKey, text, guarded);
      } catch (error) {
        return failureFromError(GROQ_PROVIDER_NAME, error);
      }
    },
  };
}
